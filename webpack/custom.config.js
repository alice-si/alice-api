const baseConfig = require('./base.config');
const merge = require('webpack-merge');
const webpack = require('webpack');

// IMPORTANT PROBLEM - WEBHOOKS

module.exports = merge(baseConfig, {
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: {
        API: JSON.stringify('http://expcruk.alice.si/api'),
        URL: JSON.stringify('http://expcruk.alice.si'),
        MANGO: {
          url: JSON.stringify('https://api.sandbox.mangopay.com'),
          clientId: JSON.stringify('kuba')
        }
      }
    })
  ]
});
