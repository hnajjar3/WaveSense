const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Import the plugin

module.exports = {
  entry: './src/index.js', // Adjust the entry path
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Define the output path
  },
};
