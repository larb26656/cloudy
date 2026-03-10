// components/chat/ToolCallCard.tsx
import { FileText, Terminal, Search, Settings, Check, X, Loader2, AlertCircle } from 'lucide-react';
import type { ToolExecution } from '../../types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ToolCallCardProps {
  tool: ToolExecution;
  onCancel?: () => void;
}

const toolIcons: Record<string, React.ReactNode> = {
  read_file: <FileText className="size-4" />,
  write_file: <FileText className="size-4" />,
  execute_command: <Terminal className="size-4" />,
  search_files: <Search className="size-4" />,
  default: <Settings className="size-4" />,
};

const statusConfig = {
  pending: {
    icon: <Loader2 className="size-4 animate-spin" />,
    color: 'secondary',
    label: 'Pending',
  },
  running: {
    icon: <Loader2 className="size-4 animate-spin" />,
    color: 'default',
    label: 'Running',
  },
  complete: {
    icon: <Check className="size-4" />,
    color: 'secondary',
    label: 'Complete',
  },
  error: {
    icon: <X className="size-4" />,
    color: 'destructive',
    label: 'Error',
  },
};

export function ToolCallCard({ tool, onCancel }: ToolCallCardProps) {
  const config = statusConfig[tool.status];
  const Icon = toolIcons[tool.tool] || toolIcons.default;

  const formatArguments = (args: Record<string, unknown>) => {
    const entries = Object.entries(args);
    if (entries.length === 0) return null;
    
    return entries.map(([key, value]) => {
      let displayValue: string;
      if (typeof value === 'string') {
        displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      } else {
        displayValue = JSON.stringify(value);
      }
      return (
        <div key={key} className="text-xs">
          <span className="text-muted-foreground">{key}:</span>{' '}
          <span className="font-mono">{displayValue}</span>
        </div>
      );
    });
  };

  return (
    <Card size="sm" className="mb-3">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{Icon}</div>
          <span className="text-sm font-medium">
            {tool.tool}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.color as 'secondary' | 'default' | 'destructive'} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
          {tool.status === 'running' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      {Object.keys(tool.arguments).length > 0 && (
        <CardContent className="pt-0">
          {formatArguments(tool.arguments)}
        </CardContent>
      )}
      {tool.status === 'running' && (
        <CardContent className="pt-2">
          <div className="flex items-center gap-2">
            <Progress value={tool.progress} className="h-1.5" />
            <span className="text-xs text-muted-foreground w-10 text-right">{tool.progress}%</span>
          </div>
        </CardContent>
      )}
      {tool.status === 'complete' && tool.result !== undefined && (
        <CardContent className="pt-2">
          <div className="text-xs text-muted-foreground font-mono">
            {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
          </div>
        </CardContent>
      )}
      {tool.status === 'error' && tool.error && (
        <CardContent className="pt-2">
          <div className="flex items-start gap-2 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>{tool.error}</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
