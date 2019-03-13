const baseConfig = require('./base.config');
const merge = require('webpack-merge');
const webpack = require('webpack');

module.exports = merge(baseConfig, {
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: {
        API: JSON.stringify('https://api.stage.alice.si/api'),
        URL: JSON.stringify('https://stage.alice.si'),
        MANGO: {
          url: JSON.stringify('https://api.sandbox.mangopay.com'),
          clientId: JSON.stringify('kuba')
        }
      }
    })
  ]
});
