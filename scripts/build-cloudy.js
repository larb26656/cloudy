const { execSync } = require('child_process');

console.log("==> Building frontend...");
execSync('npm run build --workspace=apps/web-app', { stdio: 'inherit' });

console.log("==> Cleaning dist folder...");
execSync('rm -rf apps/server/dist', { stdio: 'inherit' });

console.log("==> Bundling server CLI...");
execSync('npm run build --workspace=apps/server', { stdio: 'inherit' });

console.log("==> Copying public assets to dist...");
execSync('cp -r apps/web-app/dist apps/server/dist/public', { stdio: 'inherit' });

console.log("==> Copying migrations to dist...");
execSync('cp -r apps/server/src/db/migrations apps/server/dist/migrations', { stdio: 'inherit' });

console.log("==> Build complete!");
console.log("");
console.log("Output: apps/server/dist/");
execSync('ls -la apps/server/dist/');