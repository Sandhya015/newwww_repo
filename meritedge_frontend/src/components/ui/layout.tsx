// Layout components to replace antd Layout
import { cn } from "@/lib/utils";

interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className={cn("flex flex-col min-h-screen", className)}>
      {children}
    </div>
  );
};

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export const Header = ({ children, className }: HeaderProps) => {
  return (
    <header className={cn("flex items-center", className)}>
      {children}
    </header>
  );
};

interface SiderProps {
  children?: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  collapsedWidth?: number;
  width?: number;
  breakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  trigger?: React.ReactNode;
  collapsible?: boolean;
}

export const Sider = ({ 
  children, 
  className,
  collapsed = false,
  collapsedWidth = 80,
  width = 200,
  trigger,
  collapsible,
  ...props
}: SiderProps & React.HTMLAttributes<HTMLElement>) => {
  return (
    <aside 
      className={cn("flex flex-col transition-all duration-300", className)}
      style={{
        width: collapsed ? collapsedWidth : width,
        minWidth: collapsed ? collapsedWidth : width,
        maxWidth: collapsed ? collapsedWidth : width,
        ...props.style,
      }}
      {...props}
    >
      {children}
      {collapsible && trigger && (
        <div className="mt-auto">
          {trigger}
        </div>
      )}
    </aside>
  );
};

interface ContentProps {
  children?: React.ReactNode;
  className?: string;
}

export const Content = ({ children, className }: ContentProps) => {
  return (
    <main className={cn("flex-1 overflow-auto", className)}>
      {children}
    </main>
  );
};

Layout.Header = Header;
Layout.Sider = Sider;
Layout.Content = Content;

