import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const [, , rootArg, portArg = '4200'] = process.argv;

if (!rootArg) {
  console.error('Usage: node scripts/serve-static.mjs <root> [port]');
  process.exit(1);
}

const rootDirectory = path.resolve(process.cwd(), rootArg);
const port = Number(portArg);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const server = http.createServer(async (request, response) => {
  try {
    const requestedPath = new URL(request.url ?? '/', 'http://localhost').pathname;
    const resolvedPath = await resolvePath(requestedPath);
    const extension = path.extname(resolvedPath.absolutePath);

    response.writeHead(resolvedPath.statusCode, {
      'Content-Type': mimeTypes.get(extension) ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });

    createReadStream(resolvedPath.absolutePath).pipe(response);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`[serve-static] ${rootDirectory} on http://localhost:${port}`);
});

async function resolvePath(requestPath) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^([.][.][/\\])+/, '');
  const candidates = [];

  if (safePath === '/' || safePath === '.') {
    candidates.push(path.join(rootDirectory, 'index.html'));
  } else {
    const absoluteCandidate = path.join(rootDirectory, safePath);
    candidates.push(
      absoluteCandidate,
      path.join(absoluteCandidate, 'index.html'),
      path.join(rootDirectory, `${safePath}.html`),
    );
  }

  for (const candidate of candidates) {
    if (await isFile(candidate)) {
      return { absolutePath: candidate, statusCode: 200 };
    }
  }

  const notFoundPage = path.join(rootDirectory, '404', 'index.html');

  if (await isFile(notFoundPage)) {
    return { absolutePath: notFoundPage, statusCode: 404 };
  }

  return { absolutePath: path.join(rootDirectory, 'index.html'), statusCode: 404 };
}

async function isFile(candidatePath) {
  try {
    await access(candidatePath);
    const candidateStat = await stat(candidatePath);
    return candidateStat.isFile();
  } catch {
    return false;
  }
}