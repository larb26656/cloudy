import { useEffect, useState } from "react";
import { http, HttpResponse, delay } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { QuestionV2Request } from "@opencode-ai/sdk/v2";
import { Button } from "@/components/ui/button";
import { questionKeys } from "@/lib/opencode";
import { useQuestions } from "@/hooks/queries/useQuestions";
import { QuestionSheet } from "./QuestionSheet";
import preview from "../../../.storybook/preview";

const DEMO_DIRECTORY = "/demo/project";

const initialQuestions: QuestionV2Request[] = [
  {
    id: "que_f990d0d0c00105x6HHo1UQevzP",
    sessionID: "ses_066f50c05ffeKdaKvp34Y4sTEm",
    questions: [
      {
        question: "เลือกภาษาที่คุณใช้ (เลือกได้หลายข้อ)",
        header: "ภาษา",
        options: [
          {
            label: "JavaScript/TypeScript",
            description: "React, Node",
          },
          {
            label: "Python",
            description: "Django, FastAPI",
          },
          {
            label: "Java/Kotlin",
            description: "Spring Boot",
          },
          {
            label: "Go",
            description: "Backend",
          },
          {
            label: "อื่นๆ",
            description: "ระบุเอง",
          },
        ],
        multiple: true,
      },
      {
        question: "คุณกำลังทำอะไรอยู่?",
        header: "สถานะ",
        options: [
          {
            label: "ทำโปรเจกต์ส่วนตัว",
            description: "freelance/ของตัวเอง",
          },
          {
            label: "ทำงานประจำ",
            description: "งานบริษัท",
          },
          {
            label: "เรียน/ฝึกอบรม",
            description: "กำลังพัฒนาทักษะ",
          },
          {
            label: "แค่สำรวจเครื่องมือ",
            description: "อยากรู้ว่ามีอะไร",
          },
        ],
        multiple: false,
      },
      {
        question: "ต้องการให้ช่วยเรื่องอะไร? (เลือกได้หลายข้อ)",
        header: "งาน",
        options: [
          {
            label: "เขียน/แก้ไขโค้ด",
            description: "พัฒนาฟีเจอร์",
          },
          {
            label: "ออกแบบระบบ",
            description: "วาง architecture",
          },
          {
            label: "เขียน test",
            description: "unit/integration test",
          },
          {
            label: "สร้างเอกสาร",
            description: "concept, plan doc",
          },
          {
            label: "debug",
            description: "หา bug",
          },
        ],
        multiple: true,
      },
      {
        question: "โปรเจกต์อยู่ในขั้นตอนไหน?",
        header: "ขั้นตอน",
        options: [
          {
            label: "ยังไม่เริ่ม",
            description: "อยากเริ่มใหม่",
          },
          {
            label: "กำลังพัฒนา",
            description: "กลางคัน",
          },
          {
            label: "เกือบเสร็จ",
            description: "อยากปิดงาน",
          },
          {
            label: "มีปัญหา",
            description: "ติดปัญหาอยู่",
          },
        ],
        multiple: false,
      },
      {
        question: "มีข้อจำกัดอะไรบ้าง? (เลือกได้หลายข้อ)",
        header: "ข้อจำกัด",
        options: [
          {
            label: "ไม่มี",
            description: "ทำได้ตามสบาย",
          },
          {
            label: "Deadline",
            description: "มีกำหนดเวลา",
          },
          {
            label: "Tech stack ตายตัว",
            description: "ต้องใช้เทคโนโลรีที่กำหนด",
          },
          {
            label: "Budget จำกัด",
            description: "ทรัพยากรน้อย",
          },
          {
            label: "ต้อง maintain",
            description: "ต้องดูแลต่อเนื่อง",
          },
        ],
        multiple: true,
      },
    ],
    tool: {
      messageID: "msg_f990ccfe9001TT7XaFkqAmplAh",
      callID: "call_function_6sg2nu4dzs9s_1",
    },
  },
];

let demoQuestions: QuestionV2Request[] = [...initialQuestions];

const resetDemo = () => {
  demoQuestions = [...initialQuestions];
};

const removeById = (id: string) => {
  demoQuestions = demoQuestions.filter((q) => q.id !== id);
};

const idFrom = (url: URL, pattern: RegExp) =>
  url.pathname.match(pattern)?.[1] ?? "";

const listPattern = /\/question(?:\?|$)/;
const replyPattern = /\/question\/([^/]+)\/reply/;
const rejectPattern = /\/question\/([^/]+)\/reject/;

const handlers = [
  http.get(listPattern, () => HttpResponse.json(demoQuestions)),
  http.post(replyPattern, async ({ request }) => {
    removeById(idFrom(new URL(request.url), replyPattern));
    return new HttpResponse(null, { status: 200 });
  }),
  http.post(rejectPattern, async ({ request }) => {
    removeById(idFrom(new URL(request.url), rejectPattern));
    return new HttpResponse(null, { status: 200 });
  }),
];

const errorHandlers = [
  http.get(listPattern, () => HttpResponse.json(demoQuestions)),
  http.post(replyPattern, async () => {
    await delay(600);
    return HttpResponse.json(
      { message: "Failed to submit answer (mock 500)" },
      { status: 500 },
    );
  }),
  http.post(rejectPattern, async () => {
    await delay(600);
    return HttpResponse.json(
      { message: "Failed to reject question (mock 500)" },
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

function QuestionSheetDemo() {
  const [open, setOpen] = useState(true);
  const { data: questions = [] } = useQuestions({ directory: DEMO_DIRECTORY });

  useEffect(() => {
    resetDemo();
  }, [questions]);

  const handleReset = () => {
    resetDemo();
    queryClient.invalidateQueries({
      queryKey: questionKeys.list(DEMO_DIRECTORY),
    });
    setOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <p className="text-sm text-muted-foreground">
        {questions.length} pending question(s)
      </p>
      <Button variant="outline" onClick={handleReset}>
        Reset demo
      </Button>
      {questions.length > 0 ? (
        <QuestionSheet
          open={open}
          onOpenChange={setOpen}
          question={questions[0]}
          directory={DEMO_DIRECTORY}
        />
      ) : null}
    </div>
  );
}

const meta = preview.meta({
  title: "Question/QuestionSheet",
  component: QuestionSheet,
  parameters: {
    layout: "fullscreen",
    msw: { handlers },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
});

export const MultipleQuestionsQueued = meta.story({
  render: () => <QuestionSheetDemo />,
});

export const SubmissionFails = meta.story({
  render: () => <QuestionSheetDemo />,
  parameters: {
    msw: { handlers: errorHandlers },
  },
});
