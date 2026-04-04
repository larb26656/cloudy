import type {
  FilePart as FilePartType,
  FilePartSource,
} from "@opencode-ai/sdk/v2";
import { Paperclip } from "lucide-react";
import { Card, CardContent } from "@cloudy/ui";
import CollapsiblePart from "./CollapsiblePart";

interface FilePartProps {
  part: FilePartType;
}

interface FileSourceDisplayProps {
  source: FilePartSource;
}

function FileSourceDisplay({ source }: FileSourceDisplayProps) {
  if (source.type === "file") {
    return (
      <div className="text-xs text-muted-foreground">
        {source.path} ({source.text.start}-{source.text.end})
      </div>
    );
  }

  if (source.type === "symbol") {
    return (
      <div className="text-xs text-muted-foreground">
        {source.path}:{source.range.start.line + 1}
      </div>
    );
  }

  return null;
}

export function FilePart({ part }: FilePartProps) {
  return (
    <CollapsiblePart
      label="File"
      detail={part.filename || "Untitled"}
    >
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Paperclip className="size-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                File
              </span>
              <span className="text-sm text-green-900 dark:text-green-100 font-medium">
                {part.filename || "Untitled"}
              </span>
            </div>
            {part.source && <FileSourceDisplay source={part.source} />}
            {part.mime && (
              <div className="text-xs text-green-700 dark:text-green-300">
                MIME: {part.mime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
