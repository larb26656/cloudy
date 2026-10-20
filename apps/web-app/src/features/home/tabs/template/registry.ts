import { chatTemplate } from "../implementations/chat";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";
import { filesTemplate } from "../implementations/files";
import { terminalTemplate } from "../implementations/terminal";
import { globalEventsTemplate } from "../implementations/global-events";

export const templates = {
  chat: chatTemplate,
  desk: deskTemplate,
  webview: webviewTemplate,
  files: filesTemplate,
  terminal: terminalTemplate,
  "global-events": globalEventsTemplate,
} as const;
