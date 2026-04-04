import { OpencodeClient } from '@opencode-ai/sdk/v2/client';
export { C as ChatInputContent, M as MentionAttrs, a as ModelConfig, b as buildParts } from './types-DeKiEcLw.js';
export { Message, Part, SessionMessagesResponse } from '@opencode-ai/sdk/v2';

declare function initCoreChat(oc: OpencodeClient): void;
declare function getOc(): OpencodeClient;
type SdkError = {
    message?: string;
    data?: unknown;
    errors?: Array<{
        message?: string;
    }>;
    name?: string;
};
declare function getErrorMessage(error: SdkError): string;
declare function createDefaultTitle(isChild?: boolean): string;

export { type SdkError, createDefaultTitle, getErrorMessage, getOc, initCoreChat };
