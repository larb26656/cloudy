import type { Tab, TabTemplate } from "./tabTemplates";
import { tabTypeMap } from "./tabTemplates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RuntimeTabTemplate = TabTemplate<any>;

function getRuntimeTemplate(tab: Tab): RuntimeTabTemplate {
  return tabTypeMap[tab.type] as RuntimeTabTemplate;
}

export function TabTitle({ tab }: { tab: Tab }) {
  const { TitleComponent } = getRuntimeTemplate(tab);

  return <TitleComponent data={tab.data} />;
}

export function getTabWorkspaceId(tab: Tab) {
  const template = getRuntimeTemplate(tab);

  return template.getWorkspaceId?.(tab.data);
}
