export function getPnpmCommand(platform = process.platform) {
  return platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

export function createWorkflows() {
  return {
    test: {
      description:
        'Run shared libraries, API, client unit tests, then Playwright end-to-end tests.',
      phases: [
        {
          name: 'shared-libraries',
          parallel: false,
          commands: [
            {
              name: 'libs',
              args: ['test:libs'],
            },
          ],
        },
        {
          name: 'unit',
          parallel: true,
          commands: [
            {
              name: 'api',
              args: ['test:api'],
            },
            {
              name: 'client',
              args: ['test:unit'],
            },
          ],
        },
        {
          name: 'end-to-end',
          parallel: false,
          commands: [
            {
              name: 'e2e',
              args: ['test:e2e'],
            },
          ],
        },
      ],
    },
  };
}
