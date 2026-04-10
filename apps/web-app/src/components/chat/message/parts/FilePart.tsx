import type {
  FilePart as FilePartType,
  FilePartSource,
} from "@opencode-ai/sdk/v2";
import { Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Paperclip className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                File
              </span>
              <span className="text-sm font-medium">
                {part.filename || "Untitled"}
              </span>
            </div>
            {part.source && <FileSourceDisplay source={part.source} />}
            {part.mime && (
              <div className="text-xs text-muted-foreground">
                MIME: {part.mime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
