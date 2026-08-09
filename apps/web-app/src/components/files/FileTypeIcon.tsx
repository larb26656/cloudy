import { Icon } from "@iconify/react";
import type { CSSProperties } from "react";
import { getFileIconName } from "@/lib/file-icons";

/** Iconify prefix the bundled collection was registered under. */
const ICON_PREFIX = "vscode-icons";

interface FileTypeIconProps {
  /** Filename with extension (typically `FileNode.name`). */
  name: string;
  /** Pixel size of the square icon. Defaults to 16 to match tree rows. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a colored vscode-icons glyph for the given filename.
 *
 * Inline import of `@/lib/file-icons` is what triggers the one-time
 * `addCollection(...)` registration, so any component using `<FileTypeIcon>`
 * automatically has the curated icon set available.
 *
 * Convention (per apps/web-app/AGENTS.md): keep `data-icon` on the element —
 * it's the project's hook for sizing inline icons. vscode-icons ship their
 * own fill colors, so `text-*` utilities won't affect them.
 */
export function FileTypeIcon({
  name,
  size = 16,
  className,
  style,
}: FileTypeIconProps) {
  return (
    <Icon
      data-icon
      icon={`${ICON_PREFIX}:${getFileIconName(name)}`}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
    />
  );
}
