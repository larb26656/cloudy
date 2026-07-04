import { FileCode, FileText, Image, Video, File } from 'lucide-react';
import type { ArtifactType } from '@/features/artifact/types';

interface TypeBadgeProps {
  type: ArtifactType;
}

const config: Record<ArtifactType, { icon: typeof FileCode; label: string; className: string }> = {
  html: { icon: FileCode, label: 'HTML', className: 'text-orange-500' },
  pdf: { icon: FileText, label: 'PDF', className: 'text-red-500' },
  image: { icon: Image, label: 'Image', className: 'text-green-500' },
  video: { icon: Video, label: 'Video', className: 'text-purple-500' },
  document: { icon: File, label: 'Document', className: 'text-blue-500' },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const { icon: Icon, label, className } = config[type];
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
