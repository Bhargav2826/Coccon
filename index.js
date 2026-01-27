const { spawn } = require('child_process');
const path = require('path');

// This file exists to satisfy Render's default start command (node index.js)
// It proxies the execution to the backend's start script with the correct working directory.

console.log('🚀 Root index.js: Starting backend via npm start...');

const backendPath = path.join(__dirname, 'backend');
const child = spawn('npm', ['start'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
});

child.on('error', (err) => {
    console.error('❌ Failed to start backend process:', err);
    process.exit(1);
});

child.on('close', (code) => {
    console.log(`backend process exited with code ${code}`);
    process.exit(code);
});
