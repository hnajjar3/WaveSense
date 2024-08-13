const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Ensure this line is present

module.exports = {
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
};
