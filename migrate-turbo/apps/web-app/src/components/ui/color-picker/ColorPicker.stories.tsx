import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { ColorPicker } from "./ColorPicker"
import { WORKSPACE_COLORS } from "@/stores/workspaceStore"

const meta = {
  title: "UI/ColorPicker",
  component: ColorPicker,
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
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const Small: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "sm",
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const Large: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "lg",
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const SixColumns: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 6,
    size: "md",
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const WithLabel: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Workspace Color",
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const Disabled: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    disabled: true,
  },
  render: (args) => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const CustomColors: Story = {
  args: {
    colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"] as const,
    columns: 3,
    size: "md",
  },
  render: (args) => {
    const colors = args.colors ?? ["#FF0000"]
    const [value, setValue] = useState<string>(colors[0])
    return <ColorPicker {...args} value={value} onChange={setValue} />
  },
}

export const WithReactHookForm: Story = {
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Color",
  },
  render: (args) => {
    const { control, watch } = useForm({
      defaultValues: { color: WORKSPACE_COLORS[0] },
    })
    const selectedColor = watch("color")

    return (
      <div className="space-y-4">
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <ColorPicker
              {...args}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <p className="text-sm text-muted-foreground">
          Selected: <span style={{ color: selectedColor }}>{selectedColor}</span>
        </p>
      </div>
    )
  },
}
