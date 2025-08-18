const webpack = require('webpack');
require('dotenv').config();

// Get all environment variables with AIO_ prefix (used by both actions and web builds)
const aioEnvVars = Object.keys(process.env)
  .filter(key => key.startsWith('AIO_'))
  .reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return acc;
  }, {});

module.exports = {
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.actions.json'
            }
          }
        }
      ]
    },
    resolve: {
      modules: ['node_modules'], // default, but good to be explicit
      extensions: ['.ts', '.js'], // include necessary extensions
    },
    plugins: [
      // Only AIO_* variables are inlined; set AIO_ENABLE_DEMO_MODE to control demo mode in web app
      new webpack.DefinePlugin(aioEnvVars)
    ]
}