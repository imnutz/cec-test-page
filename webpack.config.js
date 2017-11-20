const path = require('path');

module.exports = {
    entry: './script.js',

    output: {
        path: path.resolve(__dirname),
        filename: 'bundle.js'
    },

    devtool: "source-map",

    devServer: {
        port: 3000
    },

    module: {
        rules: [
            {
                test: /.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    }
}
