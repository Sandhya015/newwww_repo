// Space component to replace antd Space
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpaceProps {
  children?: React.ReactNode;
  className?: string;
  size?: number | "small" | "middle" | "large" | [number, number];
  direction?: "horizontal" | "vertical";
  align?: "start" | "end" | "center" | "baseline";
  wrap?: boolean;
  split?: React.ReactNode;
}

export default function Space({
  children,
  className,
  size = "middle",
  direction = "horizontal",
  align,
  wrap = false,
  split
}: SpaceProps) {
  const sizeMap = {
    small: 8,
    middle: 16,
    large: 24
  };

  const gap = typeof size === "number" 
    ? size 
    : Array.isArray(size)
    ? undefined
    : sizeMap[size];

  const gapStyle = Array.isArray(size)
    ? { gap: `${size[1]}px ${size[0]}px` }
    : { gap: `${gap}px` };

  return (
    <div
      className={cn(
        "flex",
        direction === "horizontal" ? "flex-row" : "flex-col",
        align === "start" && "items-start",
        align === "end" && "items-end",
        align === "center" && "items-center",
        align === "baseline" && "items-baseline",
        wrap && "flex-wrap",
        className
      )}
      style={gapStyle}
    >
      {React.Children.map(children, (child, index) => {
        if (child === null || child === undefined) return null;
        return (
          <>
            {index > 0 && split && <span>{split}</span>}
            <div>{child}</div>
          </>
        );
      })}
    </div>
  );
}

