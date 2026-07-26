import { useEffect, useState } from "react";
import { http, HttpResponse, delay } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PermissionRequest } from "@opencode-ai/sdk/v2";
import { Button } from "@/components/ui/button";
import { permissionKeys } from "@/lib/opencode";
import { usePermissions } from "@/hooks/queries/usePermissions";
import { PermissionDialog } from "./PermissionDialog";
import preview from "../../../.storybook/preview";

const DEMO_DIRECTORY = "/demo/project";

const buildRequest = (
  overloads: Partial<PermissionRequest> & Pick<PermissionRequest, "id" | "permission" | "patterns">,
): PermissionRequest => ({
  sessionID: "ses_demo",
  metadata: {},
  always: [],
  ...overloads,
});

const initialRequests: Record<string, PermissionRequest[]> = {
  single: [
    buildRequest({
      id: "per_read_1",
      permission: "read",
      patterns: ["src/**/*.ts"],
    }),
  ],
  write: [
    buildRequest({
      id: "per_write_1",
      permission: "write",
      patterns: ["src/features/permission/PermissionDialog.tsx"],
    }),
  ],
  delete: [
    buildRequest({
      id: "per_delete_1",
      permission: "delete",
      patterns: ["dist/legacy/**"],
    }),
  ],
  list: [
    buildRequest({
      id: "per_list_1",
      permission: "list",
      patterns: ["node_modules/**"],
    }),
  ],
  unknown: [
    buildRequest({
      id: "per_other_1",
      permission: "execute",
      patterns: ["scripts/migrate.sh"],
    }),
  ],
  full: [
    buildRequest({
      id: "per_full_1",
      permission: "write",
      patterns: ["packages/database/src/schema/permission.ts"],
      always: ["edit", "write"],
      tool: {
        messageID: "msg_demo_full",
        callID: "call_demo_full_1",
      },
    }),
  ],
  multiple: [
    buildRequest({
      id: "per_multi_read",
      permission: "read",
      patterns: ["README.md", "package.json"],
    }),
    buildRequest({
      id: "per_multi_write",
      permission: "write",
      patterns: ["src/index.ts"],
      always: ["write"],
    }),
    buildRequest({
      id: "per_multi_delete",
      permission: "delete",
      patterns: ["logs/*.log"],
      tool: {
        messageID: "msg_multi_delete",
        callID: "call_multi_delete",
      },
    }),
  ],
};

let demoRequests: PermissionRequest[] = [...initialRequests.single];

const resetDemo = (scenario: keyof typeof initialRequests) => {
  demoRequests = [...initialRequests[scenario]];
};

const removeById = (id: string) => {
  demoRequests = demoRequests.filter((p) => p.id !== id);
};

const listPattern = /\/permission(?:\?|$)/;
const replyPattern = /\/permission\/([^/]+)\/reply/;

const idFrom = (url: URL) => url.pathname.match(replyPattern)?.[1] ?? "";

function makeHandlers() {
  return [
    http.get(listPattern, () => HttpResponse.json(demoRequests)),
    http.post(replyPattern, async ({ request }) => {
      removeById(idFrom(new URL(request.url)));
      return new HttpResponse(null, { status: 200 });
    }),
  ];
}

const errorHandlers = [
  http.get(listPattern, () => HttpResponse.json(demoRequests)),
  http.post(replyPattern, async () => {
    await delay(600);
    return HttpResponse.json(
      { message: "Failed to reply to permission (mock 500)" },
      { status: 500 },
    );
  }),
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

function PermissionDialogDemo({
  scenario,
}: {
  scenario: keyof typeof initialRequests;
}) {
  const [open, setOpen] = useState(true);
  const { data: permissions = [] } = usePermissions({
    directory: DEMO_DIRECTORY,
  });

  useEffect(() => {
    resetDemo(scenario);
  }, [scenario]);

  const handleReset = () => {
    resetDemo(scenario);
    queryClient.invalidateQueries({
      queryKey: permissionKeys.request.list(DEMO_DIRECTORY),
    });
    setOpen(true);
  };

  const activePermission = permissions[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <p className="text-sm text-muted-foreground">
        {permissions.length} pending permission request(s) — scenario:{" "}
        <code className="text-foreground">{scenario}</code>
      </p>
      <Button variant="outline" onClick={handleReset}>
        Reset demo
      </Button>
      {activePermission ? (
        <PermissionDialog
          open={open}
          onOpenChange={setOpen}
          permission={activePermission}
          directory={DEMO_DIRECTORY}
        />
      ) : null}
    </div>
  );
}

const meta = preview.meta({
  title: "Permission/PermissionDialog",
  component: PermissionDialog,
  parameters: {
    layout: "fullscreen",
    msw: { handlers: makeHandlers() },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
});

export const SingleReadRequest = meta.story({
  render: () => <PermissionDialogDemo scenario="single" />,
});

export const WriteRequest = meta.story({
  render: () => <PermissionDialogDemo scenario="write" />,
});

export const DeleteRequest = meta.story({
  render: () => <PermissionDialogDemo scenario="delete" />,
});

export const ListRequest = meta.story({
  render: () => <PermissionDialogDemo scenario="list" />,
});

export const UnknownPermissionType = meta.story({
  render: () => <PermissionDialogDemo scenario="unknown" />,
});

export const WithToolAndAlwaysAllow = meta.story({
  render: () => <PermissionDialogDemo scenario="full" />,
});

export const MultipleRequestsQueued = meta.story({
  render: () => <PermissionDialogDemo scenario="multiple" />,
});

export const SubmissionFails = meta.story({
  render: () => <PermissionDialogDemo scenario="single" />,
  parameters: {
    msw: { handlers: errorHandlers },
  },
});
