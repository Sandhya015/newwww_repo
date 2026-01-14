// Tag component to replace antd Tag
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface TagProps {
  children?: React.ReactNode;
  className?: string;
  color?: string;
  closable?: boolean;
  onClose?: (e?: React.MouseEvent<HTMLElement>) => void;
  icon?: React.ReactNode;
}

export default function Tag({
  children,
  className,
  color,
  closable,
  onClose,
  icon
}: TagProps) {
  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onClose?.(e);
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md",
        color && `bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200`,
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

