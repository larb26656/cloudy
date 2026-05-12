const { execSync } = require('child_process');

console.log("==> Building frontend for electron...");
execSync('npm run build:electron --workspace=apps/web-app', { stdio: 'inherit' });

console.log("==> Packaging electron app...");
execSync('cd apps/desktop && npm run package', { stdio: 'inherit' });

console.log("==> Done!");