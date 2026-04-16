import type { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  centerSlot?: ReactNode;
  prefixActions?: ReactNode[];
  actions?: ReactNode[];
}

export function Header({
  title,
  subtitle,
  centerSlot,
  prefixActions,
  actions,
}: HeaderProps) {
  return (
    <header className="p-2 bg-background flex items-center justify-between gap-3 relative">
      <div className="flex items-center gap-1">{prefixActions}</div>

      <div className="flex-1 flex flex-col min-w-0">
        {!centerSlot && (
          <>
            <h1 className="font-semibold text-gray-800 dark:text-white truncate">
              {title || "Cloudy"}
            </h1>
            {subtitle && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>

      {centerSlot && (
        <div className="absolute left-1/2 -translate-x-1/2">{centerSlot}</div>
      )}

      <div className="flex items-center gap-1 shrink-0 overflow-visible">
        {actions}
      </div>
    </header>
  );
}
