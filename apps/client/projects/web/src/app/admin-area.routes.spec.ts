import { describe, expect, it } from 'vitest';
import type { Route } from '@angular/router';
import { adminAreaCanMatch, adminAreaRoutes } from './admin-area.routes';

describe('admin-area.routes', () => {
  it('Given the admin area route guard, When canMatch is evaluated, Then it returns true', () => {
    const route: Route = { path: 'admin' };
    expect(adminAreaCanMatch(route, [])).toBe(true);
  });

  it('Given admin routes, When reading children paths, Then dashboard, programmes and ressources routes are declared', () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const childPaths = (adminRoot?.children ?? []).map((child) => child.path);

    expect(childPaths).toContain('dashboard');
    expect(childPaths).toContain('programmes');
    expect(childPaths).toContain('ressources');
    expect(childPaths).toContain('');
  });
});
