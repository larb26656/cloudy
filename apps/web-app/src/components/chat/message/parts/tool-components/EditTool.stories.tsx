import preview from "@/storybook/preview";
import { EditTool } from "./EditTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/EditTool",
  component: EditTool,
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

export const SingleLineEdit = meta.story({
  name: "Single-line edit",
  args: {
    tool: "edit",
    state: {
      status: "completed",
      input: {
        filePath: "packages/server/src/container.ts",
        oldString: "const port = 3000;",
        newString: "const port = 4122;",
      },
      output: "Edited 1 line",
      title: "edit",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000040 },
    } as any,
  },
});

export const MultiLineEdit = meta.story({
  name: "Multi-line edit",
  args: {
    tool: "edit",
    state: {
      status: "completed",
      input: {
        filePath: "apps/web-app/src/App.tsx",
        oldString:
          "function App() {\n  return <div>Hello</div>;\n}",
        newString:
          "function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}",
      },
      output: "Edited 4 lines",
      title: "edit",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000060 },
    } as any,
  },
});

export const Insertion = meta.story({
  name: "Insertion (empty oldString)",
  args: {
    tool: "edit",
    state: {
      status: "completed",
      input: {
        filePath: "packages/server/src/db/schema/index.ts",
        oldString: "",
        newString: "export * from \"./workspace\";\n",
      },
      output: "Inserted 1 line",
      title: "edit",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000020 },
    } as any,
  },
});
