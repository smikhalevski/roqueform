const nodeResolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const path = require('path');
const pkg = require(path.resolve('package.json'));

module.exports = {
  input: './src/main/index.ts',
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true },
  ],
  plugins: [
    nodeResolve(),

    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      include: './src/main/**/*',
      compilerOptions: {
        paths: {},
        outDir: './lib',
      },
    }),
  ],
  external: Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies)),
};
