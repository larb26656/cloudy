import preview from "@/storybook/preview";
import { ArrowLeft, Menu, RefreshCw, Settings, X } from "lucide-react";
import { AppBar } from "./AppBar";

const meta = preview.meta({
  title: "Layout/AppBar",
  component: AppBar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

export const Default = meta.story({
  render: () => (
    <AppBar>
      <AppBar.Title>Settings</AppBar.Title>
    </AppBar>
  ),
});

export const WithLeadingBack = meta.story({
  render: () => (
    <AppBar>
      <AppBar.Leading>
        <AppBar.ActionIcon icon={ArrowLeft} label="Back" />
      </AppBar.Leading>
      <AppBar.Title>Appearance</AppBar.Title>
    </AppBar>
  ),
});

export const Full = meta.story({
  render: () => (
    <AppBar>
      <AppBar.Leading>
        <AppBar.ActionIcon icon={Menu} label="Menu" size="lg" />
      </AppBar.Leading>
      <AppBar.Title>Home</AppBar.Title>
      <AppBar.Actions>
        <AppBar.ActionIcon icon={RefreshCw} label="Refresh" />
        <AppBar.ActionIcon icon={Settings} label="Settings" />
        <AppBar.ActionIcon icon={X} label="Close" />
      </AppBar.Actions>
    </AppBar>
  ),
});

export const ReactNodeTitle = meta.story({
  render: () => (
    <AppBar>
      <AppBar.Title>
        <span className="text-muted-foreground">@</span>username
      </AppBar.Title>
    </AppBar>
  ),
});

export const LongTitle = meta.story({
  render: () => (
    <div className="w-64">
      <AppBar>
        <AppBar.Leading>
          <AppBar.ActionIcon icon={ArrowLeft} label="Back" />
        </AppBar.Leading>
        <AppBar.Title>
          This is a very long title that should truncate
        </AppBar.Title>
        <AppBar.Actions>
          <AppBar.ActionIcon icon={X} label="Close" />
        </AppBar.Actions>
      </AppBar>
    </div>
  ),
});

export const Sticky = meta.story({
  render: () => (
    <div className="h-48 overflow-y-auto border-x">
      <AppBar sticky>
        <AppBar.Title>Sticky AppBar</AppBar.Title>
      </AppBar>
      <div className="space-y-2 p-4 text-sm">
        {Array.from({ length: 30 }).map((_, i) => (
          <p key={i}>Scroll content {i + 1}</p>
        ))}
      </div>
    </div>
  ),
});
