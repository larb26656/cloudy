import { sessionTemplate } from "../implementations/session";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";

export const templates = {
  session: sessionTemplate,
  desk: deskTemplate,
  webview: webviewTemplate,
} as const;
