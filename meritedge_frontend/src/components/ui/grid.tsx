// Grid components to replace antd Row and Col
import { cn } from "@/lib/utils";

interface RowProps {
  children?: React.ReactNode;
  className?: string;
  gutter?: number | [number, number];
  justify?: "start" | "end" | "center" | "space-around" | "space-between";
  align?: "top" | "middle" | "bottom";
  wrap?: boolean;
}

export const Row = ({ 
  children, 
  className,
  gutter,
  justify = "start",
  align = "top",
  wrap = true
}: RowProps) => {
  const justifyClasses = {
    start: "justify-start",
    end: "justify-end",
    center: "justify-center",
    "space-around": "justify-around",
    "space-between": "justify-between"
  };

  const alignClasses = {
    top: "items-start",
    middle: "items-center",
    bottom: "items-end"
  };

  const gutterStyle = gutter 
    ? typeof gutter === "number" 
      ? { gap: `${gutter}px` }
      : { gap: `${gutter[0]}px ${gutter[1]}px` }
    : {};

  return (
    <div 
      className={cn(
        "flex",
        justifyClasses[justify],
        alignClasses[align],
        wrap && "flex-wrap",
        className
      )}
      style={gutterStyle}
    >
      {children}
    </div>
  );
};

interface ColProps {
  children?: React.ReactNode;
  className?: string;
  span?: number;
  offset?: number;
  xs?: number | { span?: number; offset?: number };
  sm?: number | { span?: number; offset?: number };
  md?: number | { span?: number; offset?: number };
  lg?: number | { span?: number; offset?: number };
  xl?: number | { span?: number; offset?: number };
  xxl?: number | { span?: number; offset?: number };
}

export const Col = ({ 
  children, 
  className,
  span = 24,
  offset = 0,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl
}: ColProps) => {
  // Convert span to percentage width
  const getWidth = (s: number) => (s / 24) * 100;
  const getOffset = (o: number) => (o / 24) * 100;

  const baseWidth = getWidth(span);
  const baseOffset = getOffset(offset);

  // Responsive classes would need Tailwind config, using inline styles for now
  const style: React.CSSProperties = {
    width: `${baseWidth}%`,
    marginLeft: baseOffset > 0 ? `${baseOffset}%` : undefined,
  };

  return (
    <div 
      className={cn("flex-shrink-0", className)}
      style={style}
    >
      {children}
    </div>
  );
};

