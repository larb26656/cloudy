import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@cloudy/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@cloudy/ui';
import type { Memory } from '@/features/memory/types';

interface CreateMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (memory: Omit<Memory, 'id' | 'meta'>) => void;
}

export function CreateMemoryDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateMemoryDialogProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [markdown, setMarkdown] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: content.trim() || name.trim(),
      markdown: markdown.trim() || `# ${name.trim()}\n\n${content.trim()}`,
    });

    setName('');
    setContent('');
    setMarkdown('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Memory</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              placeholder="Memory title"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Input
              id="content"
              placeholder="Brief description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="markdown" className="text-sm font-medium">
              Markdown Content (optional)
            </label>
            <textarea
              id="markdown"
              placeholder="# Title&#10;&#10;Your markdown content here..."
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            <Plus className="mr-2 size-4" />
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
