import { cn } from "@/lib/utils";

interface PathTextProps {
  path: string;
  className?: string;
}

export function PathText({ path, className }: PathTextProps) {
  const lastSlash = path.lastIndexOf("/");
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
  const filename = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;

  return (
    <span className={cn("flex min-w-0 items-center", className)}>
      <span className="truncate">{dir}</span>
      <span className="shrink-0">{filename}</span>
    </span>
  );
}
