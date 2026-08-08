import { useState } from "react";
import preview from "@/storybook/preview";
import { QuickPhrasesBar } from "./QuickPhrasesBar";

const SAMPLE_PHRASES = [
  "Explain this code",
  "Write a test",
  "Fix the bug",
  "Refactor this",
];

const MANY_PHRASES = [
  "Explain this code",
  "Write a test",
  "Fix the bug",
  "Refactor this",
  "Add error handling",
  "Optimize performance",
  "Add documentation",
  "Review my changes",
  "Generate types",
  "Create a component",
];

function QuickPhrasesBarDemo({ phrases }: { phrases: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <QuickPhrasesBar phrases={phrases} onSelect={setSelected} />
      {selected && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono">{selected}</span>
        </p>
      )}
    </div>
  );
}

const meta = preview.meta({
  title: "Chat/ChatInput/QuickPhrasesBar",
  component: QuickPhrasesBar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[400px] rounded-lg border bg-muted p-2">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  render: () => <QuickPhrasesBarDemo phrases={SAMPLE_PHRASES} />,
});

export const ManyPhrases = meta.story({
  render: () => <QuickPhrasesBarDemo phrases={MANY_PHRASES} />,
});

export const SinglePhrase = meta.story({
  render: () => <QuickPhrasesBarDemo phrases={["Explain this code"]} />,
});
