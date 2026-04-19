export {};

console.log("==> Building frontend...");
await Bun.$`bun run --filter @cloudy/web-app build`;

console.log("==> Cleaning dist folder...");
await Bun.$`rm -rf apps/server/dist`;

console.log("==> Bundling server CLI...");
await Bun.$`bun run --filter @cloudy/server build`;

console.log("==> Copying public assets to dist...");
await Bun.$`cp -r apps/server/public apps/server/dist/public`;

console.log("==> Copying migrations to dist...");
await Bun.$`cp -r apps/server/src/db/migrations apps/server/dist/migrations`;

console.log("==> Build complete!");
console.log("");
console.log("Output: apps/server/dist/");
await Bun.$`ls -la apps/server/dist/`;
