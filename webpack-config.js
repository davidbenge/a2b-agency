module.exports = {
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          // includes, excludes are in tsconfig.json
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        }
      ]
    },
    resolve: {
      modules: ['node_modules'], // default, but good to be explicit
      extensions: ['.ts', '.js'], // include necessary extensions
    }
}