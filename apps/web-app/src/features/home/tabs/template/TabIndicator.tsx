import type { Tab, TabTemplate } from "./tabTemplates";
import { tabTypeMap } from "./tabTemplates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RuntimeTabTemplate = TabTemplate<any>;

export function TabIndicator({
  tab,
  onClose,
}: {
  tab: Tab;
  onClose: () => void;
}) {
  const template = tabTypeMap[tab.type] as RuntimeTabTemplate;
  const IndicatorComponent = template.IndicatorComponent;

  if (!IndicatorComponent) return null;

  return (
    <IndicatorComponent data={tab.data} tabId={tab.id} onClose={onClose} />
  );
}
