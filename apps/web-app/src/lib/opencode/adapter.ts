import type {
  FileContent as SdkFileContent,
  FileNode as SdkFileNode,
  PermissionRequest as SdkPermissionRequest,
  QuestionAnswer as SdkQuestionAnswer,
  QuestionV2Request as SdkQuestionRequest,
  Session as SdkSession,
  SessionStatus as SdkSessionStatus,
  SessionV2Info as SdkRecentSession,
  VcsFileDiff as SdkVcsFileDiff,
} from "@opencode-ai/sdk/v2";
import type {
  AgentPartInput,
  FilePartInput,
  SubtaskPartInput,
  TextPartInput,
} from "@opencode-ai/sdk/v2/types";
import type {
  ChatSession,
  FileContent,
  FileNode,
  PermissionRequest,
  QuestionAnswer,
  QuestionRequest,
  RecentChatSession,
  SessionRunStatus,
  SessionErrorInfo,
  VcsFileDiff,
} from "@/types";

export function toChatSession(session: SdkSession): ChatSession {
  return {
    id: session.id,
    title: session.title,
    parentID: session.parentID,
    directory: session.directory,
    updatedAt: session.time.updated,
    cost: session.cost,
    tokens: session.tokens,
  };
}

export function toRecentChatSession(
  session: SdkRecentSession,
): RecentChatSession {
  return {
    id: session.id,
    title: session.title,
    directory: session.location.directory,
    updatedAt: session.time.updated,
  };
}

export function toSessionRunStatus(status: SdkSessionStatus): SessionRunStatus {
  if (status.type === "retry") {
    return {
      type: "retry",
      attempt: status.attempt,
      message: status.message,
      next: status.next,
    };
  }
  return { type: status.type === "busy" ? "busy" : "idle" };
}

export function toFileNode(node: SdkFileNode): FileNode {
  return {
    name: node.name,
    path: node.path,
    absolute: node.absolute,
    type: node.type,
    ignored: node.ignored,
  };
}

export function toFileContent(content: SdkFileContent): FileContent {
  return { type: content.type, content: content.content };
}

export function toVcsFileDiff(diff: SdkVcsFileDiff): VcsFileDiff {
  return {
    file: diff.file,
    additions: diff.additions,
    deletions: diff.deletions,
    status: diff.status,
    patch: diff.patch,
  };
}

export function toPermissionRequest(
  request: SdkPermissionRequest,
): PermissionRequest {
  return {
    id: request.id,
    sessionID: request.sessionID,
    permission: request.permission,
    patterns: request.patterns,
    always: request.always,
    tool: request.tool ? { messageID: request.tool.messageID } : undefined,
  };
}

export function toQuestionRequest(
  request: SdkQuestionRequest,
): QuestionRequest {
  return {
    id: request.id,
    sessionID: request.sessionID,
    questions: request.questions.map((question) => ({
      header: question.header,
      question: question.question,
      multiple: question.multiple ?? false,
      options: question.options,
    })),
  };
}

export function toQuestionAnswer(answers: QuestionAnswer): SdkQuestionAnswer {
  return answers;
}

export function toSessionError(error: unknown): SessionErrorInfo {
  const value = error && typeof error === "object" ? error : {};
  const record = value as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object" ? record.data : {};
  return {
    name: typeof record.name === "string" ? record.name : "SessionError",
    message: typeof record.message === "string" ? record.message : undefined,
    data: data as SessionErrorInfo["data"],
  };
}

export function buildPromptParts(
  directory: string,
  content: {
    text: string;
    mentions: Array<{ id: string }>;
    attachments: Array<{ mime: string; dataUrl: string; filename: string }>;
  },
): (TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput)[] {
  const mentionParts: FilePartInput[] = content.mentions.map((mention) => {
    const path = `${directory}/${mention.id}`;
    return {
      type: "file",
      mime: "text/plain",
      url: `file://${path}`,
      filename: mention.id,
      source: {
        type: "file",
        text: { value: mention.id, start: 0, end: mention.id.length },
        path,
      },
    };
  });
  const attachmentParts: FilePartInput[] = content.attachments.map(
    (attachment) => ({
      type: "file",
      mime: attachment.mime,
      url: attachment.dataUrl,
      filename: attachment.filename,
    }),
  );
  return [
    { type: "text", text: content.text },
    ...mentionParts,
    ...attachmentParts,
  ];
}
