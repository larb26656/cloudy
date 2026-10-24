import { createServer } from "@repo/server";
import { join } from "node:path";
import { desktopConfig } from "./config";

type DesktopServer = ReturnType<typeof createServer>;

function isAddressInUse(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "EADDRINUSE"
  );
}

export async function startDesktopServer(): Promise<{
  url: string;
  stop: DesktopServer["stop"];
}> {
  if (!desktopConfig.isDev) process.chdir(desktopConfig.unpackedDistDir);

  const options = {
    ui: !desktopConfig.isDev,
    publicDir: desktopConfig.isDev
      ? undefined
      : join(desktopConfig.unpackedDistDir, "public"),
    configDir: desktopConfig.isDev
      ? join(desktopConfig.mainDir, "..", "config")
      : undefined,
  };
  let server = createServer({
    ...options,
    host: desktopConfig.host,
    port: desktopConfig.fixedPort,
    secureLanAccess: true,
  });

  try {
    const { url } = await server.start();
    console.log(`cloudy server listening on ${url}`);
    return { url, stop: server.stop };
  } catch (error) {
    await server.stop().catch(() => undefined);
    if (!isAddressInUse(error)) throw error;
    console.warn(
      `port ${desktopConfig.fixedPort} is busy, falling back to a dynamic port`,
    );
    server = createServer({
      ...options,
      host: desktopConfig.host,
      port: 0,
      secureLanAccess: true,
    });
    try {
      const { url } = await server.start();
      console.log(`cloudy server listening on ${url}`);
      return { url, stop: server.stop };
    } catch (fallbackError) {
      await server.stop().catch(() => undefined);
      throw fallbackError;
    }
  }
}
