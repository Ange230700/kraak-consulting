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
});
