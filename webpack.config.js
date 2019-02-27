const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'alice-bundle.js'
  },
  node: {
    // These modules don't work on client side
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};