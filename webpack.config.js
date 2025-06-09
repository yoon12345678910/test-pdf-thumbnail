// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/main.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.ts$/,
        type: 'asset/resource', // 필요 시 워커에 대한 핸들링
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    historyApiFallback: true,
  },
};
