import { chatTemplate } from "../implementations/chat";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";
import { filesTemplate } from "../implementations/files";
import { terminalTemplate } from "../implementations/terminal";
import { botChatTemplate } from "../implementations/bot-chat";

export const templates = {
  chat: chatTemplate,
  "bot-chat": botChatTemplate,
  desk: deskTemplate,
  webview: webviewTemplate,
  files: filesTemplate,
  terminal: terminalTemplate,
} as const;
