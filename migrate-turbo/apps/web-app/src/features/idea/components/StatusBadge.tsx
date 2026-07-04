import { Circle, Loader2, CheckCircle2, Archive } from 'lucide-react';
import type { IdeaStatus } from '@/features/idea/types';

interface StatusBadgeProps {
  status: IdeaStatus;
}

const config: Record<IdeaStatus, { icon: typeof Circle; label: string; className: string }> = {
  draft: { icon: Circle, label: 'Draft', className: 'text-muted-foreground' },
  'in-progress': { icon: Loader2, label: 'In Progress', className: 'text-blue-500' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'text-green-500' },
  archived: { icon: Archive, label: 'Archived', className: 'text-orange-500' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { icon: Icon, label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
