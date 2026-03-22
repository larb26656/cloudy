import type { IdeaPriority } from '@/features/idea/types';

interface PriorityBadgeProps {
  priority: IdeaPriority;
}

const config: Record<IdeaPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, className } = config[priority];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  );
}
