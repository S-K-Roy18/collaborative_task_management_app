module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
