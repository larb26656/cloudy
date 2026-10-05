import type { PetBridgeApi } from "@/lib/desktop/petBridge";

export {};

declare global {
  interface Window {
    __CLOUDY_DESKTOP__?: {
      apiUrl: string;
      isDev: boolean;
      platform: string;
      windowKind?: "main" | "pet";
      petBridge?: PetBridgeApi;
    };
  }
}
