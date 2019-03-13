const baseConfig = require('./base.config');
const merge = require('webpack-merge');
const webpack = require('webpack');

module.exports = merge(baseConfig, {
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: {
        API: JSON.stringify('https://api.donationsapp.alice.si/api'),
        URL: JSON.stringify('https://donationsapp.alice.si'),
        MANGO: {
          url: JSON.stringify('https://api.mangopay.com'),
          clientId: JSON.stringify('alice1703si')
        }
      }
    })
  ]
});
