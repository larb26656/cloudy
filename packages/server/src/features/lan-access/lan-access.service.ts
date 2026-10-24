import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { LanAccessRepository } from "./lan-access.repository";

const PIN_TTL_MS = 60_000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createLanAccessService(repository: LanAccessRepository) {
  let pin: { value: string; expiresAt: number } | null = null;
  let failedAttempts = 0;
  let blockedUntil = 0;

  return {
    createPin(now = Date.now()): { code: string; expiresAt: number } {
      const code = String(randomInt(100_000, 1_000_000));
      pin = { value: code, expiresAt: now + PIN_TTL_MS };
      failedAttempts = 0;
      blockedUntil = 0;
      return { code, expiresAt: pin.expiresAt };
    },
    pair(code: string, name: string, now = Date.now()): string | null {
      if (!pin || now >= pin.expiresAt || now < blockedUntil) {
        if (pin && now >= pin.expiresAt) pin = null;
        return null;
      }
      const expected = Buffer.from(pin.value);
      const actual = Buffer.from(code);
      const matches =
        expected.length === actual.length && timingSafeEqual(expected, actual);
      if (!matches) {
        failedAttempts += 1;
        if (failedAttempts >= 5) {
          blockedUntil = now + 60_000;
          failedAttempts = 0;
        }
        return null;
      }
      pin = null;
      failedAttempts = 0;
      const token = randomBytes(32).toString("base64url");
      repository.createDevice({
        id: randomUUID(),
        name,
        tokenHash: hashToken(token),
      });
      return token;
    },
    hasToken(token: string | undefined): boolean {
      return token !== undefined && repository.hasTokenHash(hashToken(token));
    },
    listDevices: () => repository.listDevices(),
    revokeDevice: (id: string) => repository.revokeDevice(id),
    revokeAll: () => repository.revokeAll(),
  };
}

export type LanAccessService = ReturnType<typeof createLanAccessService>;
