import type { Config } from 'jest';

const coverageThresholds = {
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: String.raw`.*\.spec\.ts$`,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@kraak/contracts$': '<rootDir>/../../../packages/contracts/src/index.ts',
    '^@kraak/domain$': '<rootDir>/../../../packages/domain/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.d.ts'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: coverageThresholds,
    './**/*.ts': coverageThresholds,
  },
  testEnvironment: 'node',
};

export default config;
