/**
 * build umd version
 */
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts'
  },
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'bundle.umd.js',
    library: "apollo-link-firebase",
    libraryTarget: "umd",
    // https://github.com/webpack/webpack/issues/6522
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.release.json',
            compilerOptions: {
              declaration: false
            }
          }
        }
      }
    ]
  }
};
