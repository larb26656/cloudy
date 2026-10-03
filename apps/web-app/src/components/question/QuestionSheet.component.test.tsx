import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders, userEvent } from "@/test/utils";
import { server } from "@/test/server";
import { QuestionSheet } from "./QuestionSheet";
import type { QuestionRequest } from "@/types";

const createMockQuestion = (
  overrides?: Partial<QuestionRequest>,
): QuestionRequest => ({
  id: "que_test123",
  sessionID: "c9c91a3d-8618-4bf4-a0ca-6a78535afbc6",
  questions: [
    {
      question: "เลือกภาษาที่คุณใช้?",
      header: "ภาษา",
      options: [
        { label: "JavaScript", description: "React, Node" },
        { label: "Python", description: "Django, FastAPI" },
        { label: "Go", description: "Backend" },
      ],
      multiple: false,
    },
    {
      question: "ทำอะไรอยู่?",
      header: "สถานะ",
      options: [
        { label: "ทำโปรเจกต์ส่วนตัว", description: "freelance" },
        { label: "ทำงานประจำ", description: "งานบริษัท" },
      ],
      multiple: true,
    },
  ],
  tool: {
    messageID: "msg_test",
    callID: "call_test",
  },
  ...overrides,
});

const renderQuestionSheet = (
  question: QuestionRequest,
  {
    open = true,
    onOpenChange = vi.fn(),
  }: {
    open?: boolean;
    onOpenChange?: () => void;
  } = {},
) => {
  return renderWithProviders(
    <QuestionSheet
      open={open}
      onOpenChange={onOpenChange}
      question={question}
    />,
  );
};

describe("QuestionSheet", () => {
  let lastReply: { url: URL; body: unknown } | undefined;
  let lastReject: { url: URL; body: unknown } | undefined;

  beforeEach(() => {
    lastReply = undefined;
    lastReject = undefined;
    server.use(
      http.post(
        /\/api\/sessions\/[^/]+\/questions\/[^/]+$/,
        async ({ request }) => {
          const body = await request.json().catch(() => undefined);
          const entry = { url: new URL(request.url), body };
          if (
            typeof body === "object" &&
            body !== null &&
            "value" in body &&
            typeof body.value === "object" &&
            body.value !== null &&
            "reject" in body.value
          )
            lastReject = entry;
          else lastReply = entry;
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );
  });

  describe("Rendering", () => {
    test("renders correctly when opened", () => {
      renderQuestionSheet(createMockQuestion());
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
      expect(screen.getByText("เลือกภาษาที่คุณใช้?")).toBeInTheDocument();
    });

    test("shows RadioOptionList for single select question", () => {
      renderQuestionSheet(createMockQuestion());
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBeGreaterThan(0);
    });

    test("shows CheckboxOptionList for multiple select question", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      const checkboxes = document.querySelectorAll("[data-slot='checkbox']");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test("does not render when closed", () => {
      renderQuestionSheet(createMockQuestion(), { open: false });
      expect(screen.queryByText("Question 1 of 2")).not.toBeInTheDocument();
    });
  });

  describe("Single Select (Radio)", () => {
    test("can select one option", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      const radio = screen.getByRole("radio", { name: /JavaScript/i });
      expect(radio).toHaveAttribute("aria-checked", "true");
    });

    test("selecting another deselects previous", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("radio", { name: /Python/i }));
      const pythonRadio = screen.getByRole("radio", { name: /Python/i });
      expect(pythonRadio).toHaveAttribute("aria-checked", "true");
    });

    test("shows validation error when trying to proceed without selection", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(screen.getByText("Please select an answer")).toBeInTheDocument();
    });
  });

  describe("Multi Select (Checkbox)", () => {
    test("can select multiple options", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await userEvent.click(
        screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
      );
      await userEvent.click(
        screen.getByRole("checkbox", { name: /ทำงานประจำ/i }),
      );
      const checkbox1 = screen.getByRole("checkbox", {
        name: /ทำโปรเจกต์ส่วนตัว/i,
      });
      const checkbox2 = screen.getByRole("checkbox", { name: /ทำงานประจำ/i });
      expect(checkbox1).toHaveAttribute("aria-checked", "true");
      expect(checkbox2).toHaveAttribute("aria-checked", "true");
    });

    test("can deselect options", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await userEvent.click(
        screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
      );
      const checkbox = screen.getByRole("checkbox", {
        name: /ทำโปรเจกต์ส่วนตัว/i,
      });
      expect(checkbox).toHaveAttribute("aria-checked", "true");
      await userEvent.click(
        screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
      );
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("Other Option", () => {
    const questionWithOther: QuestionRequest = createMockQuestion({
      questions: [
        {
          question: "เลือกภาษาอื่น?",
          header: "ภาษาอื่น",
          options: [{ label: "Rust", description: "Systems" }],
          multiple: false,
        },
      ],
    });

    test("selecting other reveals text input", async () => {
      renderQuestionSheet(questionWithOther);
      await userEvent.click(screen.getByRole("radio", { name: /Other/i }));
      expect(screen.getByPlaceholderText("Please specify")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    test('"Next" advances to next step if valid', async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
    });

    test('"Next" does not advance when step is invalid', async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    test('"Back" returns to previous step', async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await userEvent.click(screen.getByRole("button", { name: /back/i }));
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    test("Submit button appears on last step", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(
        screen.getByRole("button", { name: /submit/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Submit Flow", () => {
    test("shows validation error when submitting without selection on last step", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await userEvent.click(screen.getByRole("button", { name: /submit/i }));
      expect(
        screen.getByText("Please select at least 1 option"),
      ).toBeInTheDocument();
    });

    test("shows validation error when Other is selected without text", async () => {
      const questionWithOther: QuestionRequest = createMockQuestion({
        questions: [
          {
            question: "เลือกภาษาอื่น?",
            header: "ภาษาอื่น",
            options: [{ label: "Rust", description: "Systems" }],
            multiple: false,
          },
        ],
      });
      renderQuestionSheet(questionWithOther);
      await userEvent.click(screen.getByRole("radio", { name: /Other/i }));
      await userEvent.click(screen.getByRole("button", { name: /submit/i }));
      expect(screen.getByText("Please specify")).toBeInTheDocument();
    });

    test.each([
      {
        name: "single select - JavaScript",
        setup: async () => {
          await userEvent.click(
            screen.getByRole("radio", { name: /JavaScript/i }),
          );
          await userEvent.click(screen.getByRole("button", { name: /next/i }));
          await userEvent.click(
            screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
          );
        },
        expectedAnswers: [["JavaScript"], ["ทำโปรเจกต์ส่วนตัว"]],
      },
      {
        name: "single select with Other",
        question: createMockQuestion({
          questions: [
            {
              question: "เลือกภาษาอื่น?",
              header: "ภาษาอื่น",
              options: [{ label: "Rust", description: "Systems" }],
              multiple: false,
            },
          ],
        }),
        setup: async () => {
          await userEvent.click(screen.getByRole("radio", { name: /Other/i }));
          await userEvent.type(
            screen.getByPlaceholderText("Please specify"),
            "C++",
          );
        },
        expectedAnswers: [["C++"]],
      },
      {
        name: "multiple select with Other and typed text",
        setup: async () => {
          await userEvent.click(
            screen.getByRole("radio", { name: /JavaScript/i }),
          );
          await userEvent.click(screen.getByRole("button", { name: /next/i }));
          await userEvent.click(
            screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
          );
          await userEvent.click(
            screen.getByRole("checkbox", { name: /Other/i }),
          );
          await userEvent.type(
            screen.getByPlaceholderText("Please specify"),
            "freelance",
          );
        },
        expectedAnswers: [["JavaScript"], ["ทำโปรเจกต์ส่วนตัว", "freelance"]],
      },
      {
        name: "multiple select only (no Other)",
        setup: async () => {
          await userEvent.click(
            screen.getByRole("radio", { name: /JavaScript/i }),
          );
          await userEvent.click(screen.getByRole("button", { name: /next/i }));
          await userEvent.click(
            screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
          );
          await userEvent.click(
            screen.getByRole("checkbox", { name: /ทำงานประจำ/i }),
          );
        },
        expectedAnswers: [["JavaScript"], ["ทำโปรเจกต์ส่วนตัว", "ทำงานประจำ"]],
      },
    ])(
      "answerList transformation: $name",
      async ({ question: q, setup, expectedAnswers }) => {
        renderQuestionSheet(q ?? createMockQuestion());
        await setup();
        await userEvent.click(screen.getByRole("button", { name: /submit/i }));
        await waitFor(() => {
          expect(lastReply?.body).toEqual(
            expect.objectContaining({
              value: expectedAnswers,
            }),
          );
        });
      },
    );

    test("closes sheet on success", async () => {
      const onOpenChange = vi.fn();
      renderQuestionSheet(createMockQuestion(), { onOpenChange });
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await userEvent.click(
        screen.getByRole("checkbox", { name: /ทำโปรเจกต์ส่วนตัว/i }),
      );
      await userEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Reject Flow", () => {
    test("reject button visible on step 0", () => {
      renderQuestionSheet(createMockQuestion());
      expect(
        screen.getByRole("button", { name: /reject/i }),
      ).toBeInTheDocument();
    });

    test("reject button not visible on later steps", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("radio", { name: /JavaScript/i }));
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(
        screen.queryByRole("button", { name: /reject/i }),
      ).not.toBeInTheDocument();
    });

    test("calls rejectQuestion.mutateAsync", async () => {
      renderQuestionSheet(createMockQuestion());
      await userEvent.click(screen.getByRole("button", { name: /reject/i }));
      await waitFor(() => {
        expect(lastReject?.url.pathname).toMatch(
          /\/api\/sessions\/c9c91a3d-8618-4bf4-a0ca-6a78535afbc6\/questions\/que_test123$/,
        );
        expect(lastReject?.body).toMatchObject({
          value: { reject: true },
        });
      });
    });

    test("closes sheet on reject", async () => {
      const onOpenChange = vi.fn();
      renderQuestionSheet(createMockQuestion(), { onOpenChange });
      await userEvent.click(screen.getByRole("button", { name: /reject/i }));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
