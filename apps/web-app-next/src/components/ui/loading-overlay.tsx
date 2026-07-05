import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

interface LoadingOverlayProps {
    className?: string;
}

function LoadingOverlay({ className }: LoadingOverlayProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center",
                "bg-black/40 backdrop-blur-sm",
                "animate-in fade-in duration-200",
                className
            )}
        >
            <div className="flex flex-col items-center gap-3">
                <Spinner className="size-8 text-white" />
            </div>
        </div>
    );
}

export { LoadingOverlay };
