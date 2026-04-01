import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockListIdeas = mock();
const mockCreateIdea = mock();
const mockUpdateIdeaMeta = mock();
const mockDeleteIdea = mock();

mock.module("../../lib/api", () => ({
  listIdeas: mockListIdeas,
  createIdea: mockCreateIdea,
  updateIdeaMeta: mockUpdateIdeaMeta,
  deleteIdea: mockDeleteIdea,
}));

import { list, create, update, remove } from "../../tools/idea";

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "/test",
  worktree: "/test",
  abort: new AbortController().signal,
  metadata: mock(),
  ask: mock(),
} as any;

describe("idea tools", () => {
  beforeEach(() => {
    mockListIdeas.mockReset();
    mockCreateIdea.mockReset();
    mockUpdateIdeaMeta.mockReset();
    mockDeleteIdea.mockReset();
  });

  describe("list", () => {
    test("should_return_formatted_json_when_listIdeas_succeeds", async () => {
      const ideas = [{ path: "123_idea", title: "My Idea", status: "draft" }];
      mockListIdeas.mockResolvedValue(ideas);

      const result = await list.execute({}, mockContext);

      expect(mockListIdeas).toHaveBeenCalledTimes(1);
      expect(result).toBe(JSON.stringify(ideas, null, 2));
    });

    test("should_pass_query_params_when_all_filters_provided", async () => {
      mockListIdeas.mockResolvedValue([]);

      await list.execute(
        { q: "search", status: "draft", priority: "high", tags: ["a", "b"] },
        mockContext,
      );

      const queryStr = mockListIdeas.mock.calls[0][0] as string;
      expect(queryStr).toContain("q=search");
      expect(queryStr).toContain("status=draft");
      expect(queryStr).toContain("priority=high");
      expect(queryStr).toContain("tags=a");
      expect(queryStr).toContain("tags=b");
    });

    test("should_pass_empty_query_string_when_no_filters", async () => {
      mockListIdeas.mockResolvedValue([]);

      await list.execute({}, mockContext);

      expect(mockListIdeas).toHaveBeenCalledWith("");
    });

    test("should_only_include_provided_filters", async () => {
      mockListIdeas.mockResolvedValue([]);

      await list.execute({ status: "completed" }, mockContext);

      const queryStr = mockListIdeas.mock.calls[0][0] as string;
      expect(queryStr).toContain("status=completed");
      expect(queryStr).not.toContain("q=");
      expect(queryStr).not.toContain("priority=");
      expect(queryStr).not.toContain("tags=");
    });

    test("should_not_include_tags_when_empty_array", async () => {
      mockListIdeas.mockResolvedValue([]);

      await list.execute({ tags: [] }, mockContext);

      const queryStr = mockListIdeas.mock.calls[0][0] as string;
      expect(queryStr).not.toContain("tags=");
    });

    test("should_propagate_error_when_listIdeas_fails", async () => {
      mockListIdeas.mockRejectedValue(new Error("API error 500: crash"));

      await expect(list.execute({}, mockContext)).rejects.toThrow(
        "API error 500: crash",
      );
    });
  });

  describe("create", () => {
    test("should_return_success_message_with_created_idea", async () => {
      const created = { path: "123_new-idea", title: "New Idea" };
      mockCreateIdea.mockResolvedValue(created);

      const result = await create.execute(
        { title: "New Idea" },
        mockContext,
      );

      expect(mockCreateIdea).toHaveBeenCalledWith({ title: "New Idea" });
      expect(result).toBe(
        `Idea created successfully:\n${JSON.stringify(created, null, 2)}`,
      );
    });

    test("should_pass_all_fields_to_createIdea", async () => {
      const body = {
        title: "Full Idea",
        content: "# Hello",
        tags: ["tag1"],
        status: "in-progress" as const,
        priority: "high" as const,
      };
      mockCreateIdea.mockResolvedValue({});

      await create.execute(body, mockContext);

      expect(mockCreateIdea).toHaveBeenCalledWith(body);
    });

    test("should_propagate_error_when_createIdea_fails", async () => {
      mockCreateIdea.mockRejectedValue(new Error("API error 400: bad"));

      await expect(
        create.execute({ title: "Fail" }, mockContext),
      ).rejects.toThrow("API error 400: bad");
    });
  });

  describe("update", () => {
    test("should_return_success_message_with_updated_idea", async () => {
      const updated = { path: "123_idea", title: "Updated" };
      mockUpdateIdeaMeta.mockResolvedValue(updated);

      const result = await update.execute(
        { path: "123_idea", title: "Updated" },
        mockContext,
      );

      expect(mockUpdateIdeaMeta).toHaveBeenCalledWith("123_idea", {
        title: "Updated",
      });
      expect(result).toBe(
        `Idea updated successfully:\n${JSON.stringify(updated, null, 2)}`,
      );
    });

    test("should_separate_path_from_body", async () => {
      mockUpdateIdeaMeta.mockResolvedValue({});

      await update.execute(
        {
          path: "123_my-idea",
          title: "New Title",
          status: "completed",
          priority: "low",
          tags: ["x"],
        },
        mockContext,
      );

      expect(mockUpdateIdeaMeta).toHaveBeenCalledWith("123_my-idea", {
        title: "New Title",
        status: "completed",
        priority: "low",
        tags: ["x"],
      });
    });

    test("should_propagate_error_when_updateIdeaMeta_fails", async () => {
      mockUpdateIdeaMeta.mockRejectedValue(new Error("API error 404: not found"));

      await expect(
        update.execute({ path: "bad-path", title: "x" }, mockContext),
      ).rejects.toThrow("API error 404: not found");
    });
  });

  describe("remove", () => {
    test("should_return_success_message_with_path", async () => {
      mockDeleteIdea.mockResolvedValue(undefined);

      const result = await remove.execute(
        { path: "123_old-idea" },
        mockContext,
      );

      expect(mockDeleteIdea).toHaveBeenCalledWith("123_old-idea");
      expect(result).toBe("Idea '123_old-idea' deleted successfully.");
    });

    test("should_propagate_error_when_deleteIdea_fails", async () => {
      mockDeleteIdea.mockRejectedValue(new Error("API error 403: forbidden"));

      await expect(
        remove.execute({ path: "123_protected" }, mockContext),
      ).rejects.toThrow("API error 403: forbidden");
    });
  });
});
