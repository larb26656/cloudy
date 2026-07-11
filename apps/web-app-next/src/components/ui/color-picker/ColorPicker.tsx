import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  columns?: 2 | 3 | 4 | 6;
  size?: "sm" | "md" | "lg";
  label?: string;
  disabled?: boolean;
}

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
};

function ColorPicker({
  colors,
  value,
  onChange,
  columns = 4,
  size = "md",
  label,
  disabled,
}: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <div
        className="grid w-full gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {colors.map((color) => {
          const isSelected = value === color;
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              aria-pressed={isSelected}
              aria-label={`Color ${color}`}
              className={cn(
                "rounded-lg p-0 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected &&
                  "ring-2 ring-ring ring-offset-2 ring-offset-background scale-110",
                sizeClasses[size],
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
