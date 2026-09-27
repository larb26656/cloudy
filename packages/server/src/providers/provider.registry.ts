import type {
  InteractionResponse,
  InteractionResponseInput,
  ProviderAdapter,
  ProviderEventsInput,
  ProviderInfo,
  ProviderMessageRequest,
  ProviderMessagesInput,
  ProviderSessionInput,
  PermissionRequest,
  ProviderQuestionRequest,
  ChatSession,
  CommandInfo,
  FileContent,
  FileNode,
  VcsFileDiff,
} from "@repo/ai-core";
import {
  ProviderNotFoundError,
  UnsupportedProviderOperationError,
} from "./provider.errors";

export interface ProviderRegistryOptions {
  providers: ProviderAdapter[];
}

export function createProviderRegistry({ providers }: ProviderRegistryOptions) {
  const providerMap = new Map(
    providers.map((provider) => [provider.id, provider]),
  );

  if (providerMap.size !== providers.length) {
    throw new Error("Provider IDs must be unique");
  }

  const get = (providerId: string): ProviderAdapter => {
    const provider = providerMap.get(providerId);
    if (!provider) throw new ProviderNotFoundError(providerId);
    return provider;
  };

  const requireOperation = <K extends keyof ProviderAdapter>(
    providerId: string,
    operation: K,
  ): NonNullable<ProviderAdapter[K]> => {
    const provider = get(providerId);
    const implementation = provider[operation];
    if (typeof implementation !== "function") {
      throw new UnsupportedProviderOperationError(
        providerId,
        String(operation),
      );
    }
    return implementation as NonNullable<ProviderAdapter[K]>;
  };

  return {
    get,
    list: (): ProviderAdapter[] => [...providers],
    async catalog(): Promise<ProviderInfo[]> {
      return Promise.all(providers.map((provider) => provider.getInfo()));
    },
    listSessions(
      providerId: string,
      input: { directory?: string; limit?: number },
    ): Promise<ChatSession[]> {
      const operation = requireOperation(providerId, "listSessions");
      return operation.call(get(providerId), input);
    },
    getSession(
      providerId: string,
      input: { sessionId: string; directory?: string },
    ): Promise<ChatSession> {
      const operation = requireOperation(providerId, "getSession");
      return operation.call(get(providerId), input);
    },
    getSessionChildren(
      providerId: string,
      input: { sessionId: string; directory?: string },
    ): Promise<ChatSession[]> {
      const operation = requireOperation(providerId, "getSessionChildren");
      return operation.call(get(providerId), input);
    },
    getSessionStatuses(providerId: string, input: { directory?: string }) {
      const operation = requireOperation(providerId, "getSessionStatuses");
      return operation.call(get(providerId), input);
    },
    listMessages(providerId: string, input: ProviderMessagesInput) {
      const operation = requireOperation(providerId, "listMessages");
      return operation.call(get(providerId), input);
    },
    createSession(providerId: string, input: ProviderSessionInput) {
      const operation = requireOperation(providerId, "createSession");
      return operation.call(get(providerId), input);
    },
    updateSession(providerId: string, input: ProviderSessionInput) {
      const operation = requireOperation(providerId, "updateSession");
      return operation.call(get(providerId), input);
    },
    deleteSession(
      providerId: string,
      input: { sessionId: string; directory?: string },
    ) {
      const operation = requireOperation(providerId, "deleteSession");
      return operation.call(get(providerId), input);
    },
    forkSession(providerId: string, input: ProviderSessionInput) {
      const operation = requireOperation(providerId, "forkSession");
      return operation.call(get(providerId), input);
    },
    abortSession(
      providerId: string,
      input: { sessionId: string; directory?: string },
    ) {
      const operation = requireOperation(providerId, "abortSession");
      return operation.call(get(providerId), input);
    },
    sendMessage(
      providerId: string,
      request: ProviderMessageRequest,
    ): Promise<InteractionResponse> {
      const sendMessage = requireOperation(providerId, "sendMessage");
      return sendMessage.call(get(providerId), request);
    },
    respondToInteraction(
      providerId: string,
      response: InteractionResponseInput,
    ): Promise<InteractionResponse> {
      const respond = requireOperation(providerId, "respondToInteraction");
      return respond.call(get(providerId), response);
    },
    listPermissions(
      providerId: string,
      input: { directory?: string },
    ): Promise<PermissionRequest[]> {
      const operation = requireOperation(providerId, "listPermissions");
      return operation.call(get(providerId), input);
    },
    listQuestions(
      providerId: string,
      input: { directory?: string; sessionId?: string },
    ): Promise<ProviderQuestionRequest[]> {
      const operation = requireOperation(providerId, "listQuestions");
      return operation.call(get(providerId), input);
    },
    listFiles(
      providerId: string,
      input: { directory: string; path: string },
    ): Promise<FileNode[]> {
      const operation = requireOperation(providerId, "listFiles");
      return operation.call(get(providerId), input);
    },
    readFile(
      providerId: string,
      input: { directory: string; path: string },
    ): Promise<FileContent> {
      const operation = requireOperation(providerId, "readFile");
      return operation.call(get(providerId), input);
    },
    searchFiles(
      providerId: string,
      input: { directory: string; query: string; limit?: number },
    ): Promise<string[]> {
      const operation = requireOperation(providerId, "searchFiles");
      return operation.call(get(providerId), input);
    },
    listDiff(
      providerId: string,
      input: { directory: string },
    ): Promise<VcsFileDiff[]> {
      const operation = requireOperation(providerId, "listDiff");
      return operation.call(get(providerId), input);
    },
    listCommands(
      providerId: string,
      input: { directory: string },
    ): Promise<CommandInfo[]> {
      const operation = requireOperation(providerId, "listCommands");
      return operation.call(get(providerId), input);
    },
    executeCommand(
      providerId: string,
      input: {
        sessionId: string;
        command: string;
        arguments?: string;
        directory: string;
      },
    ): Promise<unknown> {
      const operation = requireOperation(providerId, "executeCommand");
      return operation.call(get(providerId), input);
    },
    subscribeEvents(
      providerId: string,
      input?: ProviderEventsInput,
    ): AsyncIterable<import("@repo/ai-core").ChatEvent> {
      const subscribe = requireOperation(providerId, "subscribeEvents");
      return subscribe.call(get(providerId), input);
    },
  };
}

export type ProviderRegistry = ReturnType<typeof createProviderRegistry>;
