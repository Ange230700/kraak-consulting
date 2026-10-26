export function getPnpmCommand(platform = process.platform) {
  return platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function needsWindowsQuoting(argument) {
  for (const character of argument) {
    if (character === ' ' || character === '\t' || character === '"') {
      return true;
    }
  }

  return false;
}

export function quoteWindowsArgument(argument) {
  if (argument.length === 0) {
    return '""';
  }

  if (!needsWindowsQuoting(argument)) {
    return argument;
  }

  let quotedArgument = '"';
  let backslashCount = 0;

  for (const character of argument) {
    if (character === '\\') {
      backslashCount += 1;
      continue;
    }

    if (character === '"') {
      quotedArgument += '\\'.repeat(backslashCount * 2 + 1);
      quotedArgument += '"';
    } else {
      quotedArgument += '\\'.repeat(backslashCount);
      quotedArgument += character;
    }

    backslashCount = 0;
  }

  quotedArgument += '\\'.repeat(backslashCount * 2);
  quotedArgument += '"';

  return quotedArgument;
}

export function createWorkflows() {
  return {
    test: {
      description:
        'Run shared libraries, API and client unit tests, API integration tests, then Playwright end-to-end tests.',
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
              args: ['test:api:unit'],
            },
            {
              name: 'client',
              args: ['test:unit'],
            },
          ],
        },
        {
          name: 'integration',
          parallel: false,
          commands: [
            {
              name: 'api-integration',
              args: ['test:integration'],
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
