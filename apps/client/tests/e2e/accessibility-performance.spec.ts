import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RouteCheck = {
  route: string;
  title: string;
};

type AxeSummary = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

type PerfSnapshot = {
  domContentLoadedMs: number;
  loadMs: number;
  firstContentfulPaintMs: number;
};

type RouteReport = {
  route: string;
  title: string;
  axe: AxeSummary;
  axeViolations: Array<{
    id: string;
    impact: string | null;
    description: string;
    nodes: Array<Array<string>>;
  }>;
  performance: PerfSnapshot;
};

const criticalRoutes: RouteCheck[] = [
  { route: '/', title: 'Accueil' },
  { route: '/services', title: 'Services' },
  { route: '/programmes', title: 'Programmes' },
  { route: '/contact', title: 'Contact' },
];

const parseImpactSummary = (
  violations: Array<{ impact: string | null }>,
): AxeSummary => {
  const summary: AxeSummary = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  for (const violation of violations) {
    if (violation.impact === 'critical') {
      summary.critical += 1;
      continue;
    }

    if (violation.impact === 'serious') {
      summary.serious += 1;
      continue;
    }

    if (violation.impact === 'moderate') {
      summary.moderate += 1;
      continue;
    }

    if (violation.impact === 'minor') {
      summary.minor += 1;
    }
  }

  return summary;
};

test.describe.serial('Checks pré-pilot accessibilité/performance', () => {
  test('Given les pages MVP clés, When les checks sont exécutés, Then un rapport a11y/performance est produit', async ({
    page,
  }) => {
    const results: RouteReport[] = [];

    for (const routeCheck of criticalRoutes) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(routeCheck.route, { waitUntil: 'load' });

      // Stabilise visual state before axe scan to avoid animation-driven contrast false positives.
      await page.addStyleTag({
        content:
          '*,:before,:after{animation:none !important;transition:none !important;scroll-behavior:auto !important;}.kr-perf-section,section,figure.reveal-on-scroll,h1,h2,main{opacity:1 !important;transform:none !important;filter:none !important;}',
      });

      const axe = await new AxeBuilder({ page }).analyze();
      const axeSummary = parseImpactSummary(
        axe.violations.map((violation) => ({
          impact: violation.impact ?? null,
        })),
      );
      const axeViolations = axe.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact ?? null,
        description: violation.help,
        nodes: violation.nodes.map((node) => node.target as string[]),
      }));
      const blockingViolations = axe.violations.filter(
        (violation) =>
          violation.impact === 'critical' || violation.impact === 'serious',
      );

      const perf = await page.evaluate<PerfSnapshot>(() => {
        const nav = performance.getEntriesByType('navigation')[0] as
          | PerformanceNavigationTiming
          | undefined;
        const paints = performance.getEntriesByType('paint');
        const firstContentfulPaint = paints.find(
          (entry) => entry.name === 'first-contentful-paint',
        );

        return {
          domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
          loadMs: Math.round(nav?.loadEventEnd ?? 0),
          firstContentfulPaintMs: Math.round(
            firstContentfulPaint?.startTime ?? 0,
          ),
        };
      });

      // WebKit peut parfois retourner domContentLoadedEventEnd a 0; on valide alors via le meilleur jalon dispo.
      expect(Math.max(perf.domContentLoadedMs, perf.loadMs)).toBeGreaterThan(0);
      expect(perf.loadMs).toBeGreaterThan(0);
      expect(blockingViolations).toHaveLength(0);

      results.push({
        route: routeCheck.route,
        title: routeCheck.title,
        axe: axeSummary,
        axeViolations,
        performance: perf,
      });
    }

    const outputDirectory = resolve(process.cwd(), 'test-results', 'qat-06');
    mkdirSync(outputDirectory, { recursive: true });

    const outputFile = resolve(
      outputDirectory,
      'accessibility-performance-summary.json',
    );

    writeFileSync(
      outputFile,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          scope: 'QAT-06 pre-pilot web checks',
          routes: results,
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
  });
});
