import { sessionTemplate } from "../implementations/session";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";
import { filesTemplate } from "../implementations/files";

export const templates = {
  session: sessionTemplate,
  desk: deskTemplate,
  webview: webviewTemplate,
  files: filesTemplate,
} as const;
