import { chatTemplate } from "../implementations/chat";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";
import { filesTemplate } from "../implementations/files";
import { terminalTemplate } from "../implementations/terminal";

export const templates = {
  chat: chatTemplate,
  desk: deskTemplate,
  webview: webviewTemplate,
  files: filesTemplate,
  terminal: terminalTemplate,
} as const;
