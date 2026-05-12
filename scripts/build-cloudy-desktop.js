const { execSync } = require('child_process');

console.log("==> Building frontend...");
execSync('npm run build:electron --workspace=apps/web-app', { stdio: 'inherit' });

console.log("==> Cleaning dist folder...");
execSync('rm -rf apps/desktop/dist', { stdio: 'inherit' });

console.log("==> Copying dist to desktop dist...");
execSync('cp -r apps/web-app/dist apps/desktop/dist', { stdio: 'inherit' });

console.log("==> Build complete!");
console.log("");