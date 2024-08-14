const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Ensure this line is present

module.exports = {
    entry: './src/index.js', // Adjust the entry path
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
        }
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'config/default.json'), to: path.resolve(__dirname, 'public/config.json') },
            ],
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'), // Define the output path
    },
};
