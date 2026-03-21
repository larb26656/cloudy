import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Idea } from '@/types/memory';

interface CreateIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (idea: Omit<Idea, 'id' | 'meta'>) => void;
}

const statuses: IdeaStatus[] = ['draft', 'in-progress', 'completed', 'archived'];
const priorities: IdeaPriority[] = ['low', 'medium', 'high'];

const statusLabels: Record<IdeaStatus, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

const priorityLabels: Record<IdeaPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function CreateIdeaDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateIdeaDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('draft');
  const [priority, setPriority] = useState<IdeaPriority>('medium');

  const handleSubmit = () => {
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onCreate({
      name: name.trim(),
      description: description.trim() || name.trim(),
      markdown: markdown.trim() || `# ${name.trim()}\n\n${description.trim()}`,
      meta: { tags, status, priority, createdAt: '', updatedAt: '' },
    });

    setName('');
    setDescription('');
    setMarkdown('');
    setTagsInput('');
    setStatus('draft');
    setPriority('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Idea</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="idea-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="idea-name"
              placeholder="Idea title"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="idea-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="idea-description"
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="idea-status" className="text-sm font-medium">
                Status
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {statusLabels[status]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {statuses.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                      {statusLabels[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid flex-1 gap-2">
              <label htmlFor="idea-priority" className="text-sm font-medium">
                Priority
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {priorityLabels[priority]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {priorities.map((p) => (
                    <DropdownMenuItem key={p} onClick={() => setPriority(p)}>
                      {priorityLabels[p]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="idea-tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="idea-tags"
              placeholder="Comma-separated tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="idea-markdown" className="text-sm font-medium">
              Markdown Content (optional)
            </label>
            <textarea
              id="idea-markdown"
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
