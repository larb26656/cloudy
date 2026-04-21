export { };

console.log("==> Building frontend...");
await Bun.$`bun run --filter @cloudy/web-app build:electron`;

console.log("==> Cleaning dist folder...");
await Bun.$`rm -rf apps/desktop/dist`;

console.log("==> Copying dist to desktop dist...");
await Bun.$`cp -r apps/web-app/dist apps/desktop/dist`;

console.log("==> Build complete!");
console.log("");
