import { describe, expect, it, vi } from 'vitest';

import { buildPrerenderedHtmlPath } from './ssr-path';

describe('Given the web SSR prerender lookup', () => {
  it('When a safe route exists, Then the prerendered HTML path is returned', () => {
    const fileExists = vi.fn(() => true);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/a-propos',
      '/app/browser',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBe('/app/browser/a-propos/index.html');
    expect(fileExists).toHaveBeenCalledTimes(1);
  });

  it('When a traversal route is provided, Then the lookup is rejected before filesystem access', () => {
    const fileExists = vi.fn(() => true);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/../etc/passwd',
      '/app/browser',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBeUndefined();
    expect(fileExists).not.toHaveBeenCalled();
  });

  it('When the browser dist and route have extra separators, Then the normalized index path is returned', () => {
    const fileExists = vi.fn(() => true);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/',
      '/app/browser///',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBe('/app/browser/index.html');
    expect(fileExists).toHaveBeenCalledWith('/app/browser/index.html');
  });

  it('When the root route is provided and no fileExists callback is given, Then index.html path is returned by default', () => {
    const prerenderedHtmlPath = buildPrerenderedHtmlPath('/', '/app/browser');

    expect(prerenderedHtmlPath).toBe('/app/browser/index.html');
  });

  it('When the target prerendered file does not exist, Then undefined is returned', () => {
    const fileExists = vi.fn(() => false);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/contact',
      '/app/browser',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBeUndefined();
    expect(fileExists).toHaveBeenCalledWith('/app/browser/contact/index.html');
  });

  it('When browser path and route contain mixed slashes, Then the generated path is normalized', () => {
    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/services/',
      'C:\\dist\\browser\\',
      () => true,
    );

    expect(prerenderedHtmlPath).toBe('C:/dist/browser/services/index.html');
  });

  it('When the route has trailing slashes, Then the route segment is trimmed before building the index path', () => {
    const fileExists = vi.fn(() => true);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      '/a-propos///',
      '/app/browser',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBe('/app/browser/a-propos/index.html');
    expect(fileExists).toHaveBeenCalledWith('/app/browser/a-propos/index.html');
  });

  it('When a route contains backslashes, Then the lookup is rejected as unsafe', () => {
    const fileExists = vi.fn(() => true);

    const prerenderedHtmlPath = buildPrerenderedHtmlPath(
      String.raw`\admin\users`,
      '/app/browser',
      fileExists,
    );

    expect(prerenderedHtmlPath).toBeUndefined();
    expect(fileExists).not.toHaveBeenCalled();
  });
});
