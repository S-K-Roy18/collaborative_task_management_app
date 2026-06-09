module.exports = {
  testEnvironment: 'node',
  // Only match *.test.js files — excludes legacy script-style files (authTest.js, apiTest.js, etc.)
  testMatch: ['**/test/*.test.js'],
  // setupFiles runs BEFORE test framework is installed — use this for env vars
  setupFiles: ['<rootDir>/test/setup.js'],
  testTimeout: 30000,
  forceExit: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
  ],
};
