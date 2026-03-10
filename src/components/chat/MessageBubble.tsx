// components/chat/MessageBubble.tsx
import { useState } from 'react';
import { Copy, Check, RotateCcw, MoreHorizontal } from 'lucide-react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallCard } from './ToolCallCard';
import { useMessageStore } from '../../stores/messageStore';
import type { Message } from '../../types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, isStreaming, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.info.role === 'user';
  const { thinkingContent, thinkingState, toolExecutions } = useMessageStore();
  
  const getTextContent = () => {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => (part as unknown as { text: string }).text)
      .join('');
  };

  const content = getTextContent();
  
  const messageThinking = thinkingContent[message.info.id];
  const messageThinkingState = thinkingState[message.info.id];
  
  const messageTools = toolExecutions[message.info.id] || [];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm">
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.info.time.created)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] flex flex-col gap-2">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-xs font-bold">
              AI
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm px-4 py-3 border">
            {messageThinking && (
              <ThinkingBlock
                isActive={messageThinkingState === 'active'}
                reasoningText={messageThinking}
              />
            )}
            
            {messageTools.length > 0 && (
              <div className="mb-3">
                {messageTools.map((tool) => (
                  <ToolCallCard
                    key={tool.id}
                    tool={tool}
                  />
                ))}
              </div>
            )}
            
            <MarkdownRenderer content={content} />
            
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground">AI is typing...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-11">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.info.time.created)}
          </span>
          
          {message.info.model && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {message.info.model.modelID}
            </span>
          )}
          
          {!isStreaming && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                title="Copy message"
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
              
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRegenerate}
                  title="Regenerate response"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </>
          )}
        </div>

        {message.info.tokens && (
          <div className="flex items-center gap-3 ml-11 text-xs text-muted-foreground">
            <span>{message.info.tokens.total} tokens</span>
            {message.info.cost && (
              <span>${message.info.cost.toFixed(4)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
