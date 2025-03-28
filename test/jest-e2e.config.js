/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  modulePaths: ['./'], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
}
