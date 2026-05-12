const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const src = path.resolve(__dirname, '../apps/web-app/dist');
const dest = path.resolve(__dirname, '../apps/desktop/.vite/renderer/main_window');

console.log("==> Building frontend for electron...");
execSync('npm run build:electron --workspace=apps/web-app', { stdio: 'inherit' });

console.log("==> Copying dist to desktop renderer...");
fs.emptyDirSync(dest);
fs.copySync(src, dest);

console.log("==> Done!");