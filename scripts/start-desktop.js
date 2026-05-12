const { execSync } = require('child_process');
const path = require('path');

const mainPath = path.resolve(__dirname, '../apps/desktop/.vite/build/main.js');

console.log("==> Starting electron...");
execSync(`npx electron ${mainPath}`, { stdio: 'inherit', cwd: path.resolve(__dirname, '../apps/desktop') });