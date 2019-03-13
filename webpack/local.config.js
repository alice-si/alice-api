const baseConfig = require('./base.config');
const merge = require('webpack-merge');
const webpack = require('webpack');

module.exports = merge(baseConfig, {
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: {
        API: JSON.stringify('http://localhost:8080/api'),
        URL: JSON.stringify('http://localhost:8080'),
        MANGO: {
          url: JSON.stringify('https://api.sandbox.mangopay.com'),
          clientId: JSON.stringify('kuba')
        }
      }
    })
  ]
});
