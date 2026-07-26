import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders, userEvent } from "@/test/utils";
import { server } from "@/test/server";
import type { PermissionRequest } from "@opencode-ai/sdk/v2";
import { toast } from "../ui/sonner";
import { PermissionDialog } from "./PermissionDialog";

vi.mock("../ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const DEMO_DIRECTORY = "/demo/project";

const createMockPermission = (
  overrides?: Partial<PermissionRequest>,
): PermissionRequest => ({
  id: "per_test123",
  sessionID: "ses_test456",
  permission: "read",
  patterns: ["src/**/*.ts"],
  metadata: {},
  always: [],
  ...overrides,
});

const renderPermissionDialog = (
  permission: PermissionRequest,
  {
    open = true,
    onOpenChange = vi.fn(),
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  } = {},
) => {
  return renderWithProviders(
    <PermissionDialog
      open={open}
      onOpenChange={onOpenChange}
      permission={permission}
      directory={DEMO_DIRECTORY}
    />,
  );
};

describe("PermissionDialog", () => {
  let lastReply: { url: URL; body: unknown } | undefined;

  beforeEach(() => {
    lastReply = undefined;
    vi.clearAllMocks();
    server.use(
      http.post(/\/permission\/([^/]+)\/reply/, async ({ request }) => {
        lastReply = {
          url: new URL(request.url),
          body: await request.json().catch(() => undefined),
        };
        return new HttpResponse(null, { status: 200 });
      }),
    );
  });

  describe("Rendering", () => {
    test("renders correctly when opened", () => {
      renderPermissionDialog(createMockPermission());
      expect(screen.getByText("Permission Request")).toBeInTheDocument();
      expect(screen.getByText("read")).toBeInTheDocument();
      expect(screen.getByText("src/**/*.ts")).toBeInTheDocument();
    });

    test("does not render content when closed", () => {
      renderPermissionDialog(createMockPermission(), { open: false });
      expect(screen.queryByText("Permission Request")).not.toBeInTheDocument();
    });

    test("renders multiple patterns", () => {
      renderPermissionDialog(
        createMockPermission({
          patterns: ["README.md", "package.json", "src/index.ts"],
        }),
      );
      expect(screen.getByText("README.md")).toBeInTheDocument();
      expect(screen.getByText("package.json")).toBeInTheDocument();
      expect(screen.getByText("src/index.ts")).toBeInTheDocument();
    });

    test("shows 'Always Allow' section when always list is non-empty", () => {
      renderPermissionDialog(
        createMockPermission({ always: ["edit", "write"] }),
      );
      expect(screen.getByText("Always Allow")).toBeInTheDocument();
      expect(screen.getByText("edit, write")).toBeInTheDocument();
    });

    test("hides 'Always Allow' section when always list is empty", () => {
      renderPermissionDialog(createMockPermission({ always: [] }));
      expect(screen.queryByText("Always Allow")).not.toBeInTheDocument();
    });

    test("shows Tool section with messageID when tool is present", () => {
      renderPermissionDialog(
        createMockPermission({
          tool: { messageID: "msg_test", callID: "call_test" },
        }),
      );
      expect(screen.getByText("Tool")).toBeInTheDocument();
      expect(screen.getByText("Message ID: msg_test")).toBeInTheDocument();
    });

    test("hides Tool section when tool is absent", () => {
      renderPermissionDialog(createMockPermission({ tool: undefined }));
      expect(screen.queryByText("Tool")).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    test("renders all three action buttons", () => {
      renderPermissionDialog(createMockPermission());
      expect(
        screen.getByRole("button", { name: /deny/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /allow once/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /allow always/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Reply Flow", () => {
    test("Deny button posts reply with 'reject'", async () => {
      renderPermissionDialog(createMockPermission());
      await userEvent.click(screen.getByRole("button", { name: /deny/i }));
      await waitFor(() => {
        expect(lastReply?.url.pathname).toMatch(
          /\/permission\/per_test123\/reply$/,
        );
        expect(lastReply?.url.searchParams.get("directory")).toBe(
          DEMO_DIRECTORY,
        );
      });
    });

    test("Allow Once button posts reply with 'once'", async () => {
      renderPermissionDialog(createMockPermission());
      await userEvent.click(
        screen.getByRole("button", { name: /allow once/i }),
      );
      await waitFor(() => {
        expect(lastReply?.url.pathname).toMatch(
          /\/permission\/per_test123\/reply$/,
        );
      });
    });

    test("Allow Always button posts reply with 'always'", async () => {
      renderPermissionDialog(createMockPermission());
      await userEvent.click(
        screen.getByRole("button", { name: /allow always/i }),
      );
      await waitFor(() => {
        expect(lastReply?.url.pathname).toMatch(
          /\/permission\/per_test123\/reply$/,
        );
      });
    });

    test("closes dialog on successful reply", async () => {
      const onOpenChange = vi.fn();
      renderPermissionDialog(createMockPermission(), { onOpenChange });
      await userEvent.click(screen.getByRole("button", { name: /deny/i }));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      server.use(
        http.post(/\/permission\/([^/]+)\/reply/, () =>
          HttpResponse.json(
            { message: "Failed to reply to permission (mock 500)" },
            { status: 500 },
          ),
        ),
      );
    });

    test("shows error toast on failed reply", async () => {
      renderPermissionDialog(createMockPermission());
      await userEvent.click(screen.getByRole("button", { name: /deny/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to reply to permission (mock 500)",
        );
      });
    });

    test("does not close dialog on failed reply", async () => {
      const onOpenChange = vi.fn();
      renderPermissionDialog(createMockPermission(), { onOpenChange });
      await userEvent.click(screen.getByRole("button", { name: /deny/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to reply to permission (mock 500)",
        );
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });
});
