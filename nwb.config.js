const path = require('path')
const package = require('./package.json')

const cssConfig = {
  options: {
    modules: true,
    localIdentName: '[local]-[hash:base64:10]',
  },
}

module.exports = function({command}) {
  
  let config = {
    type: 'react-app',

    webpack: {
      extra: {
        resolve: {
          modules: [path.resolve('./src'), 'node_modules'],
        },
        output: {
          publicPath: '',
        },
        target: 'electron-renderer',
      },
      html: {
        template: path.resolve('./src/index.html'),
        title: package.name,
      },
      rules: {
        css: cssConfig,
        'sass-css': cssConfig,
        less: cssConfig
      },
    },

    babel: {
      stage: 0,
    },
  };

  // Only include react-hot-loader config when serving a development build
  if (command.startsWith('serve')) {
    config.babel.plugins = 'react-hot-loader/babel';
    config.webpack.config = (webpackConfig) => {
      // React Hot Loader's patch module needs to run before your app
      webpackConfig.entry.unshift('react-hot-loader/patch');
      return webpackConfig;
    }
  }
  return config;

}
