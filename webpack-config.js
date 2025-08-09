const webpack = require('webpack');
require('dotenv').config();

// Get all environment variables with AIO_ prefix
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
              compilerOptions: {
                target: 'ES2020',
                module: 'CommonJS',
                lib: ['ES2020'],
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                declaration: true,
                sourceMap: true,
                moduleResolution: 'node',
                allowSyntheticDefaultImports: true,
                resolveJsonModule: true
              }
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
      new webpack.DefinePlugin(aioEnvVars)
    ]
}