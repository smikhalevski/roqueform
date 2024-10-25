const path = require('path');

module.exports = {
  rootDir: process.cwd(),
  transform: {
    '^.+\\.tsx?$': '@swc/jest',
  },
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: ['/lib/'],
  moduleNameMapper: {
    '^roqueform$': path.resolve(__dirname, './packages/roqueform/src/main'),
    '^@roqueform/(.*)$': path.resolve(__dirname, './packages/$1/src/main'),
  },
};
