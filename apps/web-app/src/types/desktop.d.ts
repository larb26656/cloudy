import type { PetBridgeApi } from "@/lib/desktop/petBridge";
import type { QuickBridgeApi } from "@/lib/desktop/quickBridge";

export {};

declare global {
  interface Window {
    __CLOUDY_DESKTOP__?: {
      apiUrl: string;
      isDev: boolean;
      platform: string;
      windowKind?: "main" | "pet" | "quick";
      petBridge?: PetBridgeApi;
      quickBridge?: QuickBridgeApi;
      networkBridge?: {
        getState(): Promise<{
          enabled: boolean;
          devices: { id: string; name: string; createdAt: string }[];
          pairingUrls: { type: "Tailscale" | "LAN" | "Network"; url: string }[];
        } | null>;
        setEnabled(enabled: boolean): Promise<boolean>;
        createPin(): Promise<{ code: string; expiresAt: number } | null>;
        revokeDevice(id: string): Promise<boolean>;
      };
    };
  }
}
