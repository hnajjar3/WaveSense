const fs = require('fs');
const path = require('path');

// Define the source and destination paths
const srcPath = path.join(__dirname, '../config/default.json');
const destPath = path.join(__dirname, '../build/config.json');

// Log source and destination paths for verification
console.log(`Copying from: ${srcPath}`);
console.log(`Copying to: ${destPath}`);

// Check if the source file exists
if (!fs.existsSync(srcPath)) {
  console.error('Source file does not exist!');
  process.exit(1); // Exit with error
}

// Read the source file to check its contents
const srcFileContents = fs.readFileSync(srcPath, 'utf-8');

// Copy the source file to the destination
fs.copyFile(srcPath, destPath, (err) => {
  if (err) {
    console.error(`Error copying config file: ${err}`);
    return;
  }
  console.log('Config file was copied to build folder');

  // Read and log the contents of the copied file to ensure it's correct
  const copiedFile = fs.readFileSync(destPath, 'utf-8');
});
