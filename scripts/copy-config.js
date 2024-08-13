const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../config/default.json');
const destPath = path.join(__dirname, '../build/config.json');

fs.copyFile(srcPath, destPath, (err) => {
  if (err) throw err;
  console.log('Config file was copied to build folder');
});