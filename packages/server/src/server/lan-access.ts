import type { MiddlewareHandler } from "hono";
import type { LanAccessService } from "../features/lan-access/lan-access.service";

export function isLoopbackAddress(address: string | undefined): boolean {
  return (
    address === "::1" ||
    address === "127.0.0.1" ||
    address?.startsWith("::ffff:127.") === true
  );
}

export function getRemoteAddress(request: {
  socketAddress?: string;
  proxyAddress?: string;
}): string | undefined {
  return isLoopbackAddress(request.socketAddress)
    ? (request.proxyAddress ?? request.socketAddress)
    : request.socketAddress;
}

export function createLanAccessMiddleware(
  service: LanAccessService,
): MiddlewareHandler {
  return async (c, next) => {
    const requestEnv = (c.env ?? {}) as {
      incoming?: { socket?: { remoteAddress?: string } };
    };
    const remoteAddress = getRemoteAddress({
      socketAddress: requestEnv.incoming?.socket?.remoteAddress,
      proxyAddress: c.req.header("x-cloudy-proxy-remote-address"),
    });
    if (isLoopbackAddress(remoteAddress)) return next();
    const bearer = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    const token = bearer ?? c.req.query("access_token");
    if (!service.hasToken(token))
      return c.json({ message: "Pair this device to access Cloudy" }, 401);
    return next();
  };
}
