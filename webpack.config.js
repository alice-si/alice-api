const path = require('path');

module.exports = {
  entry: './alice.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'alice.js'
  },
  node: {
    // These modules don't work on client side
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  devServer: {
    compress: true,
    port: 9000
  }
};
