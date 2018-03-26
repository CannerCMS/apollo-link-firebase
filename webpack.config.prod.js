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
    libraryTarget: "umd"
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
