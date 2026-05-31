export function buildPrerenderedHtmlPath(
  routePath: string,
  browserDistFolder: string,
  fileExists?: (filePath: string) => boolean,
): string | undefined {
  if (!isSafeRoutePath(routePath)) {
    return undefined;
  }

  const normalizedBrowserDistFolder = trimTrailingSlashes(
    browserDistFolder.replaceAll('\\', '/'),
  );
  const relativeRoutePath = trimRouteSlashes(routePath.replaceAll('\\', '/'));
  const prerenderedHtmlPath =
    routePath === '/'
      ? `${normalizedBrowserDistFolder}/index.html`
      : `${normalizedBrowserDistFolder}/${relativeRoutePath}/index.html`;

  return (fileExists?.(prerenderedHtmlPath) ?? true)
    ? prerenderedHtmlPath
    : undefined;
}

function trimRouteSlashes(routePath: string): string {
  let startIndex = 0;
  let endIndex = routePath.length;

  while (startIndex < endIndex && routePath.codePointAt(startIndex) === 47) {
    startIndex += 1;
  }

  while (endIndex > startIndex && routePath.codePointAt(endIndex - 1) === 47) {
    endIndex -= 1;
  }

  return routePath.slice(startIndex, endIndex);
}

function trimTrailingSlashes(pathValue: string): string {
  let endIndex = pathValue.length;

  while (
    endIndex > 0 &&
    (pathValue.codePointAt(endIndex - 1) === 47 ||
      pathValue.codePointAt(endIndex - 1) === 92)
  ) {
    endIndex -= 1;
  }

  return pathValue.slice(0, endIndex);
}

function isSafeRoutePath(routePath: string): boolean {
  if (routePath.includes('\\')) {
    return false;
  }

  const routeSegments = trimRouteSlashes(routePath).split('/');

  return routeSegments.every((segment) => segment !== '.' && segment !== '..');
}
