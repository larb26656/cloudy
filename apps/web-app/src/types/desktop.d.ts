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
    };
  }
}
