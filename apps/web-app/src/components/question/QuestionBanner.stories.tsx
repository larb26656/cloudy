import { QuestionBanner } from "./QuestionBanner";
import preview from "../../../.storybook/preview";

const meta = preview.meta({
  title: "Question/QuestionBanner",
  component: QuestionBanner,
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
