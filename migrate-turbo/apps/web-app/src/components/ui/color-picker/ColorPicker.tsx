"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WORKSPACE_COLORS } from "@/stores/workspaceStore";

const colorPickerVariants = {
  size: {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  },
  columns: {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    6: "grid-cols-6",
  },
};

type ColorPickerProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
  colors?: readonly string[];
  columns?: keyof typeof colorPickerVariants.columns;
  size?: keyof typeof colorPickerVariants.size;
  label?: string;
  className?: string;
  disabled?: boolean;
};

function ColorPicker({
  value,
  defaultValue,
  onChange,
  colors = WORKSPACE_COLORS,
  columns = 4,
  size = "md",
  label,
  className,
  disabled,
}: ColorPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? colors[0]);
  const selectedValue = isControlled ? value : internalValue;
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleSelect = useCallback(
    (color: string) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalValue(color);
      }
      onChange?.(color);
    },
    [disabled, isControlled, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const colCount = Number(columns);
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowRight":
          newIndex = (currentIndex + 1) % colors.length;
          break;
        case "ArrowLeft":
          newIndex = (currentIndex - 1 + colors.length) % colors.length;
          break;
        case "ArrowDown":
          newIndex = Math.min(currentIndex + colCount, colors.length - 1);
          break;
        case "ArrowUp":
          newIndex = Math.max(currentIndex - colCount, 0);
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = colors.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setFocusedIndex(newIndex);
    },
    [colors.length, columns],
  );

  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const buttons = gridRef.current.querySelectorAll("button");
      buttons[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <div className={className}>
      {label && <span className="text-sm font-medium mb-2 block">{label}</span>}
      <div
        ref={gridRef}
        role="radiogroup"
        aria-label={label ?? "Color picker"}
        className={cn(
          "grid gap-2 justify-items-center",
          colorPickerVariants.columns[columns],
        )}
      >
        {colors.map((color, index) => {
          const isSelected = selectedValue === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select color ${color}`}
              disabled={disabled}
              tabIndex={
                focusedIndex === -1
                  ? isSelected
                    ? 0
                    : -1
                  : focusedIndex === index
                    ? 0
                    : -1
              }
              onClick={() => handleSelect(color)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                "rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                colorPickerVariants.size[size],
                isSelected
                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                  : "hover:scale-110",
                disabled && "opacity-50 cursor-not-allowed hover:scale-100",
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}

export { ColorPicker };
export type { ColorPickerProps };
