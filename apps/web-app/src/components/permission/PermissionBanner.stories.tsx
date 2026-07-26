import { PermissionBanner } from "./PermissionBanner";
import preview from "../../../.storybook/preview";

const meta = preview.meta({
  title: "Permission/PermissionBanner",
  component: PermissionBanner,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
});

export default meta;

export const SinglePending = meta.story({
  args: {
    count: 1,
    onOpenDialog: () => {},
  },
});

export const MultiplePending = meta.story({
  args: {
    count: 3,
    onOpenDialog: () => {},
  },
});

export const HiddenWhenZero = meta.story({
  args: {
    count: 0,
    onOpenDialog: () => {},
  },
});
