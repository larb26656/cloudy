import { useState } from "react";
import preview from "@/storybook/preview";
import { CronExpressionInput } from "./CronExpressionInput";

function CronExpressionInputDemo() {
  const [value, setValue] = useState("0 9 * * 1-5");

  return (
    <div className="w-80">
      <CronExpressionInput value={value} onChange={setValue} />
      <p className="mt-2 text-xs text-muted-foreground">
        Saved expression: <code>{value}</code>
      </p>
    </div>
  );
}

const meta = preview.meta({
  title: "Features/Automations/CronExpressionInput",
  component: CronExpressionInputDemo,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({});
