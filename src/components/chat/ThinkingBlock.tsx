// components/chat/ThinkingBlock.tsx
import { useState } from 'react';
import { ChevronDown, Brain, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ThinkingBlockProps {
  isActive: boolean;
  reasoningText?: string;
}

export function ThinkingBlock({ isActive, reasoningText }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!reasoningText && !isActive) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 w-full justify-between h-auto p-2 ${
            isActive
              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {isActive ? (
              <Sparkles className="size-4 animate-pulse" />
            ) : (
              <Brain className="size-4" />
            )}
            <span className="text-sm font-medium">
              {isActive ? 'AI is thinking...' : 'AI reasoning'}
            </span>
          </div>
          <ChevronDown
            className={`size-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {reasoningText}
          </div>
          {isActive && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400">Thinking...</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
