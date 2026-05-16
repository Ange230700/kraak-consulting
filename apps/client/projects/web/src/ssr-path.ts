import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export function buildPrerenderedHtmlPath(
  routePath: string,
  browserDistFolder: string,
  fileExists: (filePath: string) => boolean = existsSync,
): string | undefined {
  if (!isSafeRoutePath(routePath)) {
    return undefined;
  }

  const relativeIndexPath =
    routePath === '/'
      ? 'index.html'
      : join(trimRouteSlashes(routePath), 'index.html');
  const prerenderedHtmlPath = resolve(browserDistFolder, relativeIndexPath);

  if (!isPathInsideBrowserDist(prerenderedHtmlPath, browserDistFolder)) {
    return undefined;
  }

  return fileExists(prerenderedHtmlPath) ? prerenderedHtmlPath : undefined;
}

function isPathInsideBrowserDist(
  filePath: string,
  browserDistFolder: string,
): boolean {
  const resolvedBrowserDistFolder = resolve(browserDistFolder);

  return (
    filePath === resolvedBrowserDistFolder ||
    filePath.startsWith(`${resolvedBrowserDistFolder}${sep}`)
  );
}

function trimRouteSlashes(routePath: string): string {
  let startIndex = 0;
  let endIndex = routePath.length;

  while (startIndex < endIndex && routePath.charCodeAt(startIndex) === 47) {
    startIndex += 1;
  }

  while (endIndex > startIndex && routePath.charCodeAt(endIndex - 1) === 47) {
    endIndex -= 1;
  }

  return routePath.slice(startIndex, endIndex);
}

function isSafeRoutePath(routePath: string): boolean {
  if (routePath.includes('\\')) {
    return false;
  }

  const routeSegments = trimRouteSlashes(routePath).split('/');

  return routeSegments.every((segment) => segment !== '.' && segment !== '..');
}
