const { spawn } = require('child_process');
const fs = require('fs');

console.log("Starting Expo...");
const expo = spawn('npx', ['expo', 'start', '--tunnel', '--port', '8082'], {
  shell: true,
  cwd: process.cwd()
});

const logStream = fs.createWriteStream('expo_output.txt', { flags: 'a' });

expo.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  logStream.write(output);
  
  // Check for the URL
  if (output.includes('exp://')) {
    console.log("Found URL!");
  }
});

expo.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(output);
  logStream.write(output);
});

expo.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
  logStream.end();
});
