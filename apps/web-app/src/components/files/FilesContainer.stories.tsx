import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FileContent, FileNode, VcsFileDiff } from "@opencode-ai/sdk/v2";
import { http, HttpResponse } from "msw";
import { expect, within } from "storybook/test";
import preview from "@/storybook/preview";
import { FilesContainer } from "./FilesContainer";

const DEMO_DIRECTORY = "/demo/cloudy";

const changes: VcsFileDiff[] = [
  {
    file: "src/App.tsx",
    additions: 4,
    deletions: 1,
    status: "modified",
    patch: `diff --git a/src/App.tsx b/src/App.tsx
index 3dfe1aa..9ac27cf 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,3 +1,6 @@
-export function App() {
+export function App() {
+  const greeting = "Welcome to Cloudy";
+
   return <main>Cloudy</main>;
 }`,
  },
  {
    file: "src/components/StatusBadge.tsx",
    additions: 8,
    deletions: 0,
    status: "added",
    patch: `diff --git a/src/components/StatusBadge.tsx b/src/components/StatusBadge.tsx
new file mode 100644
--- /dev/null
+++ b/src/components/StatusBadge.tsx
@@ -0,0 +1,3 @@
+export function StatusBadge() {
+  return <span>Ready</span>;
+}`,
  },
  {
    file: "docs/legacy-notes.md",
    additions: 0,
    deletions: 12,
    status: "deleted",
  },
];

const rootFiles: FileNode[] = [
  {
    name: "src",
    path: "src",
    absolute: `${DEMO_DIRECTORY}/src`,
    type: "directory",
    ignored: false,
  },
  {
    name: "README.md",
    path: "README.md",
    absolute: `${DEMO_DIRECTORY}/README.md`,
    type: "file",
    ignored: false,
  },
  {
    name: "package.json",
    path: "package.json",
    absolute: `${DEMO_DIRECTORY}/package.json`,
    type: "file",
    ignored: false,
  },
  {
    name: ".cache",
    path: ".cache",
    absolute: `${DEMO_DIRECTORY}/.cache`,
    type: "directory",
    ignored: true,
  },
];

const srcFiles: FileNode[] = [
  {
    name: "components",
    path: "src/components",
    absolute: `${DEMO_DIRECTORY}/src/components`,
    type: "directory",
    ignored: false,
  },
  {
    name: "App.tsx",
    path: "src/App.tsx",
    absolute: `${DEMO_DIRECTORY}/src/App.tsx`,
    type: "file",
    ignored: false,
  },
  {
    name: "styles.css",
    path: "src/styles.css",
    absolute: `${DEMO_DIRECTORY}/src/styles.css`,
    type: "file",
    ignored: false,
  },
];

const componentFiles: FileNode[] = [
  {
    name: "StatusBadge.tsx",
    path: "src/components/StatusBadge.tsx",
    absolute: `${DEMO_DIRECTORY}/src/components/StatusBadge.tsx`,
    type: "file",
    ignored: false,
  },
];

const fileContents: Record<string, FileContent> = {
  "src/App.tsx": {
    type: "text",
    content: `export function App() {
  const message = "Explorer preview ready";
  return <main>{message}</main>;
}`,
  },
  "src/components/StatusBadge.tsx": {
    type: "text",
    content: `export function StatusBadge() {
  return <span>Search preview ready</span>;
}`,
  },
  "README.md": {
    type: "text",
    content: "# Cloudy demo workspace",
  },
  "package.json": {
    type: "text",
    content: '{"name":"cloudy-demo"}',
  },
  "src/styles.css": {
    type: "text",
    content: ".app { display: grid; }",
  },
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function StoryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function createSuccessHandlers({
  vcsDiff = changes,
  filesByPath = {
    ".": rootFiles,
    src: srcFiles,
    "src/components": componentFiles,
  },
  searchResults = ["src/components/StatusBadge.tsx", "src/App.tsx"],
}: {
  vcsDiff?: VcsFileDiff[];
  filesByPath?: Record<string, FileNode[]>;
  searchResults?: string[];
} = {}) {
  return [
    http.get("*/oc/vcs/diff", () => HttpResponse.json(vcsDiff)),
    http.get("*/oc/file", ({ request }) => {
      const path = new URL(request.url).searchParams.get("path") ?? ".";
      return HttpResponse.json(filesByPath[path] ?? []);
    }),
    http.get("*/oc/file/content", ({ request }) => {
      const path = new URL(request.url).searchParams.get("path") ?? "";
      const content = fileContents[path];
      return content
        ? HttpResponse.json(content)
        : HttpResponse.json({ message: "File not found" }, { status: 404 });
    }),
    http.get("*/oc/find/file", ({ request }) => {
      const query = new URL(request.url).searchParams.get("query") ?? "";
      const matches = searchResults.filter((path) =>
        path.toLowerCase().includes(query.toLowerCase()),
      );
      return HttpResponse.json(matches);
    }),
  ];
}

function createErrorHandlers() {
  const errorResponse = () =>
    HttpResponse.json(
      { message: "Demo backend is unavailable" },
      { status: 503 },
    );

  return [
    http.get("*/oc/vcs/diff", errorResponse),
    http.get("*/oc/file", errorResponse),
    http.get("*/oc/file/content", errorResponse),
    http.get("*/oc/find/file", errorResponse),
  ];
}

function FilesFrame({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/30 p-6">
      <div
        className="h-[600px] w-full overflow-hidden rounded-lg border bg-background"
        style={{ maxWidth: compact ? "360px" : "800px" }}
      >
        <FilesContainer directory={DEMO_DIRECTORY} />
      </div>
    </div>
  );
}

const meta = preview.meta({
  title: "Files/FilesContainer",
  component: FilesContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    msw: { handlers: createSuccessHandlers() },
  },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
});

export default meta;

export const PopulatedChanges = meta.story({
  render: () => <FilesFrame />,
});

export const FullFilePreview = meta.story({
  render: () => <FilesFrame />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Open full file: src/App.tsx",
      }),
    );
    const documentBody = within(canvasElement.ownerDocument.body);
    await expect(
      await documentBody.findByRole("dialog", { name: "src/App.tsx" }),
    ).toBeInTheDocument();
    await expect(
      await documentBody.findByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          element.textContent?.includes("Explorer preview ready") === true,
      ),
    ).toBeInTheDocument();
  },
});

export const SingleFileSelection = meta.story({
  render: () => <FilesFrame />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "Single file" }),
    );
    const legacyFileButtons = canvas.getAllByRole("button", {
      name: /docs\/legacy-notes\.md/,
    });
    await userEvent.click(legacyFileButtons[legacyFileButtons.length - 1]!);
    await expect(
      canvas.getAllByText("This file has no inline patch to display."),
    ).toHaveLength(1);
  },
});

export const Explorer = meta.story({
  render: () => <FilesFrame />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Explorer" }));
    await userEvent.click(await canvas.findByRole("button", { name: "src" }));
    await userEvent.click(
      await canvas.findByRole("button", { name: "App.tsx" }),
    );
    await expect(
      await canvas.findByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          element.textContent?.includes("Explorer preview ready") === true,
      ),
    ).toBeInTheDocument();
  },
});

export const Search = meta.story({
  render: () => <FilesFrame />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Search" }));
    await userEvent.type(
      canvas.getByPlaceholderText("Search files by name…"),
      "StatusBadge",
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: /StatusBadge\.tsx/ }),
    );
    await expect(
      await canvas.findByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          element.textContent?.includes("Search preview ready") === true,
      ),
    ).toBeInTheDocument();
  },
});

export const EmptyWorkspace = meta.story({
  parameters: {
    msw: {
      handlers: createSuccessHandlers({
        vcsDiff: [],
        filesByPath: { ".": [] },
        searchResults: [],
      }),
    },
  },
  render: () => <FilesFrame />,
});

export const BackendError = meta.story({
  parameters: { msw: { handlers: createErrorHandlers() } },
  render: () => <FilesFrame />,
});

export const CompactViewport = meta.story({
  render: () => <FilesFrame compact />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "Single file" }),
    );
    await userEvent.click(canvas.getByTitle("Show file list"));
    const documentBody = within(canvasElement.ownerDocument.body);
    await expect(
      await documentBody.findByRole("dialog", { name: "Changed files" }),
    ).toBeInTheDocument();
  },
});
