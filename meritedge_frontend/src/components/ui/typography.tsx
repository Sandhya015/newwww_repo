// Typography components to replace antd Typography
import { cn } from "@/lib/utils";

interface TypographyProps {
  children?: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5;
}

export const Title = ({ children, className, level = 1 }: TypographyProps) => {
  const levelClasses = {
    1: "text-4xl font-bold",
    2: "text-3xl font-bold",
    3: "text-2xl font-semibold",
    4: "text-xl font-semibold",
    5: "text-lg font-medium"
  };

  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <Component className={cn(levelClasses[level], className)}>
      {children}
    </Component>
  );
};

export const Paragraph = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  return (
    <p className={cn("text-base leading-relaxed", className)}>
      {children}
    </p>
  );
};

export const Text = ({ 
  children, 
  className,
  type,
  strong,
  italic,
  underline,
  delete: del,
  code,
  mark
}: { 
  children?: React.ReactNode; 
  className?: string;
  type?: "secondary" | "success" | "warning" | "danger";
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
  mark?: boolean;
}) => {
  const typeClasses = {
    secondary: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400"
  };

  let Component: keyof JSX.IntrinsicElements = "span";
  let content = children;

  if (del) Component = "del";
  if (code) Component = "code";
  if (mark) Component = "mark";

  if (strong) {
    content = <strong>{content}</strong>;
  }
  if (italic) {
    content = <em>{content}</em>;
  }
  if (underline) {
    content = <u>{content}</u>;
  }

  return (
    <Component className={cn(
      type && typeClasses[type],
      code && "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
      className
    )}>
      {content}
    </Component>
  );
};

