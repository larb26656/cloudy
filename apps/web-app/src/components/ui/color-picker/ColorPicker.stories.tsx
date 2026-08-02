import preview from "@/storybook/preview";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ColorPicker } from "./ColorPicker";
import { WORKSPACE_COLORS } from "@/lib/cloudy/workspaces";

interface ColorPickerDemoProps {
  colors: readonly string[];
  columns?: 2 | 3 | 4 | 6;
  size?: "sm" | "md" | "lg";
  label?: string;
  disabled?: boolean;
}

function ColorPickerDemo({
  colors,
  columns,
  size,
  label,
  disabled,
}: ColorPickerDemoProps) {
  const [value, setValue] = useState<string>(colors[0] ?? "");
  return (
    <ColorPicker
      colors={colors}
      columns={columns}
      size={size}
      label={label}
      disabled={disabled}
      value={value}
      onChange={setValue}
    />
  );
}

const meta = preview.meta({
  title: "UI/ColorPicker",
  component: ColorPickerDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    colors: {
      control: false,
    },
    columns: {
      control: "select",
      options: [2, 3, 4, 6],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
  },
});

export const Small = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "sm",
  },
});

export const Large = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "lg",
  },
});

export const SixColumns = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 6,
    size: "md",
  },
});

export const WithLabel = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Workspace Color",
  },
});

export const Disabled = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    disabled: true,
  },
});

export const CustomColors = meta.story({
  args: {
    colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"] as const,
    columns: 3,
    size: "md",
  },
});

export const WithReactHookForm = meta.story({
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Color",
  },
  render: () => {
    const { control, watch } = useForm({
      defaultValues: { color: WORKSPACE_COLORS[0] },
    });
    const selectedColor = watch("color");

    return (
      <div className="space-y-4">
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <ColorPicker
              colors={WORKSPACE_COLORS}
              columns={4}
              size="md"
              label="Color"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <p className="text-sm text-muted-foreground">
          Selected: <span style={{ color: selectedColor }}>{selectedColor}</span>
        </p>
      </div>
    );
  },
});
