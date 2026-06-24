import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'CommonJS' } }] },
};

export default config;
