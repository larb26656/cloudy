import { NodeResizer, useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { X, ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type StickyColor = "yellow" | "pink" | "green" | "blue" | "purple" | "orange";

type StickyNoteNodeProps = Node<
  {
    label?: string;
    color?: StickyColor;
  },
  "sticky"
>;

const colorClasses: Record<StickyColor, string> = {
  yellow: "bg-yellow-100 border-yellow-300",
  pink: "bg-pink-100 border-pink-300",
  green: "bg-emerald-100 border-emerald-300",
  blue: "bg-blue-100 border-blue-300",
  purple: "bg-purple-100 border-purple-300",
  orange: "bg-orange-100 border-orange-300",
};

export function StickyNoteNode({
  data,
  id,
  selected,
}: NodeProps<StickyNoteNodeProps>) {
  const { deleteElements, updateNodeData } = useReactFlow();
  const [text, setText] = useState(data.label ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleClose = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  const color = data.color ?? "yellow";
  const bgClass = colorClasses[color];

  const handleColorChange = useCallback(
    (newColor: StickyColor) => {
      updateNodeData(id, { color: newColor });
      setPickerOpen(false);
    },
    [id, updateNodeData],
  );

  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={100}
        maxWidth={400}
        maxHeight={300}
        handleClassName="!border-primary !bg-primary/20 hover:!bg-primary/30"
        isVisible={selected}
      />
      <div
        className={cn(
          "rounded-lg border-2 shadow-md overflow-hidden h-full flex flex-col",
          bgClass,
        )}
      >
        <div className="flex items-center justify-between px-2 py-1 border-b border-current/20">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-black/10">
              <div className={cn("w-4 h-4 rounded-full border border-black/20", bgClass)} />
              <ChevronDown className="h-3 w-3 opacity-60" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-2">
                {(Object.keys(colorClasses) as StickyColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      colorClasses[c],
                      color === c ? "border-foreground" : "border-transparent",
                    )}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button onClick={handleClose} className="p-1 hover:bg-black/10 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something..."
          className={cn(
            "flex-1 p-2 bg-transparent resize-none outline-none",
            "text-sm text-gray-800 placeholder:text-gray-400",
          )}
        />
      </div>
    </>
  );
}
