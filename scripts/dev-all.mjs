import net from 'node:net';
import { spawn } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const portInUsePattern = /Port \d+ is already in use/i;
const addressInUsePattern = /EADDRINUSE|address already in use/i;
const maxViteCacheLockLineLength = 16_384;

function isViteCacheLockLine(line) {
  if (typeof line !== 'string') {
    return false;
  }

  // Prevent oversized log lines from becoming an input-amplification vector.
  if (line.length > maxViteCacheLockLineLength) {
    return false;
  }

  const normalizedLine = line.toLowerCase().replaceAll('\\', '/');
  const angularCacheMarker = '.angular/cache';

  if (!normalizedLine.includes('eperm: operation not permitted, rename ')) {
    return false;
  }

  const angularCacheIndex = normalizedLine.indexOf(angularCacheMarker);
  if (angularCacheIndex < 0) {
    return false;
  }

  return normalizedLine.includes(
    '/vite/deps_temp_',
    angularCacheIndex + angularCacheMarker.length,
  );
}

const services = [
  {
    name: 'web',
    color: '\x1b[36m',
    preferredPort: 4200,
    cwd: process.cwd(),
    command: ['pnpm.cmd', '--filter', '@kraak/client', 'run', 'dev:web'],
    portArg: true,
  },
  {
    name: 'mobile',
    color: '\x1b[35m',
    preferredPort: 4300,
    cwd: process.cwd(),
    command: ['pnpm.cmd', '--filter', '@kraak/client', 'run', 'dev:mobile'],
    portArg: true,
    angularCacheProject: 'mobile',
  },
  {
    name: 'api',
    color: '\x1b[32m',
    preferredPort: 3000,
    cwd: process.cwd(),
    command: ['pnpm.cmd', '--filter', '@kraak/api', 'run', 'dev'],
    portArg: false,
    allowPortFallback: false,
  },
];

const reset = '\x1b[0m';
const children = new Set();
let shuttingDown = false;
const dryRun = process.argv.includes('--dry-run');

function forwardStream(stream, label, color, onLine) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.length > 0) {
        process.stdout.write(`${color}[${label}]${reset} ${line}\n`);
        onLine?.(line);
      }
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      process.stdout.write(`${color}[${label}]${reset} ${buffer}\n`);
      onLine?.(buffer);
    }
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen({
      port,
      host: '0.0.0.0',
      exclusive: true,
    });
  });
}

async function findAvailablePort(preferredPort) {
  let port = preferredPort;

  while (!(await isPortFree(port))) {
    port += 1;
  }

  return port;
}

function isPathInsideWorkspace(targetPath) {
  const workspaceRoot = path.resolve(process.cwd());
  const resolvedTarget = path.resolve(targetPath);

  return (
    resolvedTarget === workspaceRoot ||
    resolvedTarget.startsWith(`${workspaceRoot}${path.sep}`)
  );
}

async function clearAngularViteCache(projectName) {
  if (!projectName) {
    return;
  }

  const cacheRoot = path.resolve(process.cwd(), 'apps', 'client', '.angular', 'cache');

  if (!isPathInsideWorkspace(cacheRoot)) {
    throw new Error(`Refus de supprimer un cache hors workspace: ${cacheRoot}`);
  }

  let versionEntries = [];

  try {
    versionEntries = await readdir(cacheRoot, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  for (const entry of versionEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectCachePath = path.resolve(cacheRoot, entry.name, projectName);

    if (!isPathInsideWorkspace(projectCachePath)) {
      throw new Error(`Refus de supprimer un cache hors workspace: ${projectCachePath}`);
    }

    await rm(projectCachePath, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 150,
    });
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill('SIGINT');
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  }, 1500);

  setTimeout(() => {
    process.exit(exitCode);
  }, 2000);
}

export function resolveSpawnCommand(command, args, platform = process.platform) {
  if (platform !== 'win32') {
    return {
      command,
      args,
    };
  }

  if (!/\.(cmd|bat)$/i.test(command)) {
    return {
      command,
      args,
    };
  }

  return {
    command: process.env.ComSpec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', command, ...args],
  };
}

async function startService(service) {
  const allowPortFallback = service.allowPortFallback ?? true;
  const cacheRecoveryAttempts = service.cacheRecoveryAttempts ?? 0;

  if (!(await isPortFree(service.preferredPort)) && !allowPortFallback) {
    process.stdout.write(
      `${service.color}[${service.name}]${reset} port ${service.preferredPort} déjà occupé, démarrage ignoré. Le front local continue d'attendre l'API sur ce port.\n`,
    );
    return;
  }

  const port = allowPortFallback
    ? await findAvailablePort(service.preferredPort)
    : service.preferredPort;
  const args = [...service.command];
  const env = { ...process.env };

  if (service.portArg) {
    args.push('--port', String(port));
  } else {
    env.PORT = String(port);
  }

  const preferred =
    service.preferredPort === port
      ? `port ${port}`
      : `port ${port} (port préféré ${service.preferredPort} occupé)`;

  if (dryRun) {
    const simulatedPort = allowPortFallback
      ? await findAvailablePort(service.preferredPort)
      : port;
    const simulatedPreferred =
      service.preferredPort === simulatedPort
        ? `port ${simulatedPort}`
        : `port ${simulatedPort} (port préféré ${service.preferredPort} occupé)`;

    process.stdout.write(
      `${service.color}[${service.name}]${reset} simulation sur ${simulatedPreferred}\n`,
    );
    return;
  }

  process.stdout.write(
    `${service.color}[${service.name}]${reset} démarrage sur ${preferred}\n`,
  );

  const spawnCommand = resolveSpawnCommand(args[0], args.slice(1));

  // SECURITY: service.command est entièrement hardcodé dans le tableau services.
  // Les scripts .cmd/.bat Windows sont lancés via cmd.exe tout en conservant shell: false.
  const child = spawn(spawnCommand.command, spawnCommand.args, {
    cwd: service.cwd,
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  children.add(child);
  let retryOnNextPort = false;
  let portBusyOnStart = false;
  let recoverViteCache = false;

  forwardStream(child.stdout, service.name, service.color);
  forwardStream(child.stderr, service.name, service.color, (line) => {
    if (service.portArg && allowPortFallback && !retryOnNextPort) {
      if (portInUsePattern.test(line)) {
        retryOnNextPort = true;
        process.stdout.write(
          `${service.color}[${service.name}]${reset} port ${port} occupé détecté, nouvelle tentative sur ${port + 1}\n`,
        );
        child.kill('SIGTERM');
      }
      return;
    }

    if (
      service.angularCacheProject &&
      cacheRecoveryAttempts < 2 &&
      !recoverViteCache &&
      isViteCacheLockLine(line)
    ) {
      recoverViteCache = true;
      process.stdout.write(
        `${service.color}[${service.name}]${reset} verrou de cache Vite détecté, nettoyage du cache Angular ${service.angularCacheProject} puis relance.\n`,
      );
      child.kill('SIGTERM');
      return;
    }

    if (
      !service.portArg &&
      !allowPortFallback &&
      addressInUsePattern.test(line)
    ) {
      portBusyOnStart = true;
    }
  });

  child.on('exit', (code) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    if (retryOnNextPort) {
      startService({
        ...service,
        preferredPort: port + 1,
      }).catch((error) => {
        console.error(error);
        shutdown(1);
      });
      return;
    }

    if (recoverViteCache) {
      clearAngularViteCache(service.angularCacheProject)
        .then(() =>
          startService({
            ...service,
            cacheRecoveryAttempts: cacheRecoveryAttempts + 1,
          }),
        )
        .catch((error) => {
          console.error(error);
          shutdown(1);
        });
      return;
    }

    if (portBusyOnStart) {
      process.stdout.write(
        `${service.color}[${service.name}]${reset} port ${port} déjà occupé, l'API existante est conservée et le reste du mode dev continue.\n`,
      );
      return;
    }

    const exitCode = code ?? 0;
    process.stderr.write(
      `${service.color}[${service.name}]${reset} arrêté avec le code ${exitCode}\n`,
    );

    if (exitCode !== 0) {
      shutdown(exitCode);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  try {
    for (const service of services) {
      await startService(service);
    }
  } catch (error) {
    console.error(error);
    shutdown(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
