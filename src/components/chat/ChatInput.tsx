// components/chat/ChatInput.tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, StopCircle, X } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { FileMentionDropdown } from './FileMentionDropdown';
import { useMessageStore } from '../../stores/messageStore';
import type { FileReference, ModelConfig } from '../../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (text: string, model?: ModelConfig | null) => void;
  onAbort?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  directory?: string;
}

export function ChatInput({
  onSend,
  onAbort,
  isLoading,
  placeholder = 'Type a message...',
  directory,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isFileMentionOpen, setIsFileMentionOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileReference[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModel } = useMessageStore();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      let finalText = text.trim();
      if (selectedFiles.length > 0) {
        const fileMentions = selectedFiles.map(f => `@${f.path}`).join(' ');
        finalText = `${fileMentions} ${finalText}`;
      }
      
      onSend(finalText, selectedModel);
      setText('');
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@' || e.key === '/') {
      if (directory) {
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    
    if (directory && (value.endsWith('@') || value.endsWith('/'))) {
      setIsFileMentionOpen(true);
    }
  };

  const handleFileSelect = (files: FileReference[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    setText((prev) => prev.slice(0, -1));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="ml-1 hover:text-primary/70"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="relative flex items-end gap-2 bg-muted border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-ring focus-within:border-input transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              title="Attach file"
            >
              <Paperclip className="size-5" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none resize-none outline-none py-2.5 min-h-[44px] max-h-[200px]"
            />

            <div className="shrink-0 self-center">
              <ModelSelector />
            </div>

            {isLoading ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onAbort}
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Stop generating"
              >
                <StopCircle className="size-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!text.trim() && selectedFiles.length === 0}
                className="shrink-0"
                title="Send message"
              >
                <Send className="size-5" />
              </Button>
            )}
          </div>

          {directory && (
            <div className="absolute left-12 bottom-full mb-2 w-80">
              <FileMentionDropdown
                directory={directory}
                isOpen={isFileMentionOpen}
                onClose={() => setIsFileMentionOpen(false)}
                onSelect={handleFileSelect}
              />
            </div>
          )}
        </div>

        <div className="text-center mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift + Enter for new line
          {directory && ' • @ or / to mention files'}
          {' • Cmd/Ctrl + M for model'}
        </div>
      </div>
    </div>
  );
}
