import { Hono } from "hono";
import type { Context } from "hono";
import { pairDeviceSchema } from "./lan-access.model";
import type { LanAccessService } from "./lan-access.service";
import { getRemoteAddress, isLoopbackAddress } from "../../server/lan-access";

function isLocalRequest(c: Context): boolean {
  const requestEnv = (c.env ?? {}) as {
    incoming?: { socket?: { remoteAddress?: string } };
  };
  return isLoopbackAddress(
    getRemoteAddress({
      socketAddress: requestEnv.incoming?.socket?.remoteAddress,
      proxyAddress: c.req.header("x-cloudy-proxy-remote-address"),
    }),
  );
}

export function createLanAccessController(
  service: LanAccessService,
  secure: boolean,
) {
  return new Hono()
    .post("/pin", (c) => {
      if (!secure) return c.json({ message: "Pairing is disabled" }, 404);
      if (!isLocalRequest(c))
        return c.json({ message: "Local access required" }, 403);
      return c.json(service.createPin());
    })
    .get("/devices", (c) => {
      if (!isLocalRequest(c))
        return c.json({ message: "Local access required" }, 403);
      return c.json({ devices: service.listDevices() });
    })
    .delete("/devices/:id", (c) => {
      if (!isLocalRequest(c))
        return c.json({ message: "Local access required" }, 403);
      return c.json({ ok: service.revokeDevice(c.req.param("id")) });
    })
    .delete("/devices", (c) => {
      if (!isLocalRequest(c))
        return c.json({ message: "Local access required" }, 403);
      service.revokeAll();
      return c.json({ ok: true });
    })
    .post("/pair", async (c) => {
      if (!secure) return c.json({ message: "Pairing is disabled" }, 404);
      const body = pairDeviceSchema.safeParse(
        await c.req.json().catch(() => null),
      );
      if (!body.success)
        return c.json({ message: "Invalid pairing request" }, 400);
      const token = service.pair(body.data.code, body.data.name);
      if (!token)
        return c.json({ message: "Pairing code is invalid or expired" }, 401);
      return c.json({ token });
    });
}
