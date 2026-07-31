import preview from "@/storybook/preview";
import { QuestionTool } from "./QuestionTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/QuestionTool",
  component: QuestionTool,
  tags: ["autodocs"],
  argTypes: {
    tool: { control: "text", description: "Tool name" },
    state: {
      control: "object",
      description: "Tool state from SDK",
    },
  },
});

export default meta;

export const SingleQuestion = meta.story({
  name: "Single question with options",
  args: {
    tool: "question",
    state: {
      status: "completed",
      input: {
        questions: [
          {
            question: "Which state management library should we use?",
            header: "Library",
            options: [
              {
                label: "Zustand",
                description: "Lightweight, hook-based",
              },
              {
                label: "Redux Toolkit",
                description: "Mature ecosystem, devtools",
              },
            ],
          },
        ],
      },
      output: "Answered: Zustand",
      title: "question",
      metadata: {},
      time: { start: 1690000000000, end: 1690000045000 },
    } as any,
  },
});

export const MultipleQuestions = meta.story({
  name: "Multiple questions",
  args: {
    tool: "question",
    state: {
      status: "running",
      input: {
        questions: [
          { question: "Should I add dark mode?", header: "Theme" },
          { question: "Which icon set do you prefer?", header: "Icons" },
          {
            question: "Which routing solution?",
            options: [
              { label: "TanStack Router", description: "Type-safe" },
              { label: "React Router", description: "Popular" },
            ],
          },
        ],
      },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "question",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});

export const WithoutQuestions = meta.story({
  name: "Generic input (no questions array)",
  args: {
    tool: "question",
    state: {
      status: "completed",
      input: { message: "Please confirm before proceeding." },
      output: "Confirmed",
      title: "question",
      metadata: {},
      time: { start: 1690000000000, end: 1690000002000 },
    } as any,
  },
});
