// Spin component to replace antd Spin
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinProps {
  spinning?: boolean;
  tip?: string;
  size?: "small" | "default" | "large";
  children?: React.ReactNode;
  className?: string;
}

export default function Spin({ 
  spinning = true, 
  tip, 
  size = "default",
  children,
  className
}: SpinProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8"
  };

  if (children) {
    return (
      <div className={cn("relative", className)}>
        {children}
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
              {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-4", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
    </div>
  );
}

