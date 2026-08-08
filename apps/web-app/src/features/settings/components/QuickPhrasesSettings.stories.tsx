import { useEffect } from "react";
import preview from "@/storybook/preview";
import { useQuickPhrasesStore, MAX_PHRASES } from "@/stores/quickPhrasesStore";
import { QuickPhrasesSettings } from "./QuickPhrasesSettings";

function SettingsDemo({ phrases }: { phrases: string[] }) {
  useEffect(() => {
    useQuickPhrasesStore.setState({ phrases });
    return () => {
      useQuickPhrasesStore.setState({ phrases: [] });
    };
  }, [phrases]);
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <QuickPhrasesSettings />
    </div>
  );
}

const SAMPLE_PHRASES = ["Explain this code", "Write a test", "Fix the bug"];

const FULL_PHRASES = Array.from(
  { length: MAX_PHRASES },
  (_, i) => `Phrase ${i + 1}`,
);

const meta = preview.meta({
  title: "Settings/QuickPhrasesSettings",
  component: QuickPhrasesSettings,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

export const WithPhrases = meta.story({
  render: () => <SettingsDemo phrases={SAMPLE_PHRASES} />,
});

export const Empty = meta.story({
  render: () => <SettingsDemo phrases={[]} />,
});

export const Full = meta.story({
  render: () => <SettingsDemo phrases={FULL_PHRASES} />,
});
