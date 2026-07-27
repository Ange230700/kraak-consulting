import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

import { getChangedFiles, resolveBaseRef } from './workspace-git-utils.mjs';

const rootSensitivePaths = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  'tsconfig.base.json',
  'scripts/',
  '.github/',
];

const clientWorkspaceLintCommand = [
  'pnpm',
  '--filter',
  '@kraak/client',
  'lint',
];

const workspaceDefinitions = [
  {
    name: 'api',
    prefixes: ['apps/api/'],
    commands: {
      lint: ['pnpm', 'lint:api'],
      test: ['pnpm', 'test:api:unit'],
      build: ['pnpm', 'build:api'],
    },
  },
  {
    name: 'client-web',
    prefixes: ['apps/client/projects/web/'],
    commands: {
      lint: clientWorkspaceLintCommand,
      test: ['pnpm', '--filter', '@kraak/client', 'test:web'],
      build: ['pnpm', 'build:web'],
    },
  },
  {
    name: 'client-mobile',
    prefixes: ['apps/client/projects/mobile/'],
    commands: {
      lint: clientWorkspaceLintCommand,
      test: ['pnpm', '--filter', '@kraak/client', 'test:mobile'],
      build: ['pnpm', 'build:mobile'],
    },
  },
  {
    name: 'contracts',
    prefixes: ['packages/contracts/'],
    commands: {
      lint: ['pnpm', '--filter', '@kraak/contracts', 'lint'],
      test: ['pnpm', '--filter', '@kraak/contracts', 'test'],
      build: ['pnpm', '--filter', '@kraak/contracts', 'build'],
    },
  },
  {
    name: 'domain',
    prefixes: ['packages/domain/'],
    commands: {
      lint: ['pnpm', '--filter', '@kraak/domain', 'lint'],
      test: ['pnpm', '--filter', '@kraak/domain', 'test'],
      build: ['pnpm', '--filter', '@kraak/domain', 'build'],
    },
  },
  {
    name: 'api-client',
    prefixes: ['packages/api-client/'],
    commands: {
      lint: ['pnpm', '--filter', '@kraak/api-client', 'lint'],
      test: ['pnpm', '--filter', '@kraak/api-client', 'test'],
    },
  },
  {
    name: 'tokens',
    prefixes: ['packages/tokens/'],
    commands: {
      lint: ['pnpm', '--filter', '@kraak/tokens', 'lint'],
      test: ['pnpm', '--filter', '@kraak/tokens', 'test'],
    },
  },
];

const workspaceNameByDefinition = new Map(
  workspaceDefinitions.map((definition) => [definition.name, definition]),
);

function isRootSensitiveFile(filePath) {
  return rootSensitivePaths.some((pattern) => {
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern);
    }

    return filePath === pattern;
  });
}

function collectAffectedWorkspaceNames(changedFiles) {
  if (changedFiles.some(isRootSensitiveFile)) {
    return workspaceDefinitions.map((definition) => definition.name);
  }

  const affectedWorkspaceNames = new Set();

  for (const filePath of changedFiles) {
    const isClientRootFile =
      filePath.startsWith('apps/client/') &&
      !filePath.startsWith('apps/client/projects/web/') &&
      !filePath.startsWith('apps/client/projects/mobile/');

    if (isClientRootFile) {
      affectedWorkspaceNames.add('client-web');
      affectedWorkspaceNames.add('client-mobile');
    }

    for (const definition of workspaceDefinitions) {
      if (definition.prefixes.some((prefix) => filePath.startsWith(prefix))) {
        affectedWorkspaceNames.add(definition.name);
      }
    }
  }

  return [...affectedWorkspaceNames];
}

function getCommandPlan(mode, affectedWorkspaceNames) {
  const commandPlan = [];
  const seenCommands = new Set();

  for (const workspaceName of affectedWorkspaceNames) {
    const definition = workspaceNameByDefinition.get(workspaceName);
    const command = definition?.commands[mode];

    if (!command) {
      continue;
    }

    const commandKey = command.join('\u0000');

    if (seenCommands.has(commandKey)) {
      continue;
    }

    seenCommands.add(commandKey);
    commandPlan.push({ workspaceName, command });
  }

  return commandPlan;
}

function runCommand(commandParts, label) {
  console.info(`[affected] ${label}`);

  const useShell = process.platform === 'win32';
  const commandExecutable =
    process.platform === 'win32' && commandParts[0] === 'pnpm'
      ? 'pnpm'
      : commandParts[0];
  const result = spawnSync(commandExecutable, commandParts.slice(1), {
    stdio: 'inherit',
    shell: useShell,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const mode = process.argv[2];

  if (!mode) {
    console.error(
      '[affected] Utilisation: node ./scripts/affected-workspaces.mjs <lint|test|build>',
    );
    process.exit(1);
  }

  const supportedModes = new Set(['lint', 'test', 'build']);

  if (!supportedModes.has(mode)) {
    console.error(`[affected] Mode inconnu: ${mode}`);
    process.exit(1);
  }

  const gitOptions = { errorPrefix: '[affected]' };
  const changedFiles = getChangedFiles(resolveBaseRef(gitOptions), {
    ...gitOptions,
    warningMessage:
      '[affected] Impossible de détecter finement les changements, fallback sur une validation minimale.',
  });
  const affectedWorkspaceNames = collectAffectedWorkspaceNames(changedFiles);

  if (affectedWorkspaceNames.length === 0) {
    console.info('[affected] Aucun workspace affecté, rien à exécuter.');
    return;
  }

  const commandPlan = getCommandPlan(mode, affectedWorkspaceNames);

  if (commandPlan.length === 0) {
    console.info(
      `[affected] Aucun script ${mode} disponible pour les workspaces affectés.`,
    );
    return;
  }

  for (const step of commandPlan) {
    runCommand(step.command, `${mode} -> ${step.workspaceName}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main();
  } catch (error) {
    console.error('[affected] Erreur inattendue durant les contrôles:', error);
    process.exit(1);
  }
}

export {
  collectAffectedWorkspaceNames,
  getCommandPlan,
  isRootSensitiveFile,
  rootSensitivePaths,
  workspaceDefinitions,
};
