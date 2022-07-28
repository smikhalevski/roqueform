module.exports = {
  rootDir: process.cwd(),
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: ['/lib/'],
  moduleNameMapper: {
    '^roqueform$': __dirname + '/packages/roqueform',
    '^@roqueform/(.*)$': __dirname + '/packages/$1/src/main',
  },
};
