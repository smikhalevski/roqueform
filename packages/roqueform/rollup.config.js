const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: [
    './src/main/plugin/annotations.ts',
    './src/main/plugin/constraint-validation.ts',
    './src/main/plugin/errors.ts',
    './src/main/plugin/ref.ts',
    './src/main/plugin/reset.ts',
    './src/main/plugin/scroll-to-error.ts',
    './src/main/plugin/uncontrolled.ts',
    './src/main/plugin/validation.ts',
    './src/main/index.ts',
  ],
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true },
  ],
  plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
  external: ['fast-deep-equal', 'parallel-universe'],
};
