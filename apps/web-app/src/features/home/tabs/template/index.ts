import type { Tab } from "@/stores/tabStore";
import type { TabTemplate } from "./tabTemplates";
import { sessionTemplate } from "../implementations/session";
import { deskTemplate } from "../implementations/desk";
import { webviewTemplate } from "../implementations/webview";

export * from "./tabTemplates";

export const tabTemplates: TabTemplate[] = [
  sessionTemplate,
  deskTemplate,
  webviewTemplate,
];

export const tabTypeMap = tabTemplates.reduce<Partial<Record<Tab["type"], TabTemplate>>>(
  (acc, template) => {
    acc[template.type] = template;
    return acc;
  },
  {},
);
