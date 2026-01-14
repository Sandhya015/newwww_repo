import { Link, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import {
  LayoutDashboard,
  Brain,
  Book,
  Users,
  Settings,
  FileText,
  Sparkles,
  UserCheck,
  Power,
} from "lucide-react";
import { Avatar } from "antd";
import { useSidebar } from "../../context/SidebarContext";
import { useTheme } from "../../context/ThemeContext";

// Map menu titles to Lucide icons
const getIcon = (title: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Dashboard: LayoutDashboard,
    Cognitive: Brain,
    "Question Library": Book,
    Candidates: Users,
    Settings: Settings,
    Reports: FileText,
    "Create Tests": Sparkles,
    "Role-Based": UserCheck,
    Dynamic: Sparkles,
    Adaptive: Sparkles,
    Interviewer: UserCheck,
    Logout: Power,
    Profile: null, // Profile uses Avatar instead
  };

  return iconMap[title] || LayoutDashboard;
};

interface LeftSideBarMenuProps {
  route?: string;
  title: string;
  image_src?: string;
  activeRoutes?: string[]; // For Settings which has multiple active routes
  isButton?: boolean; // For Logout which is a button
  onClick?: (e: React.MouseEvent) => void; // For Logout onClick handler
  avatar?: boolean; // For Profile which uses Avatar
}

export default function LeftSideBarMenu({
  route,
  title,
  image_src,
  activeRoutes,
  isButton = false,
  onClick,
  avatar = false,
}: LeftSideBarMenuProps) {
  // Side Bar Context
  const { isSideBarOpen } = useSidebar();
  const location = useLocation();
  const { theme } = useTheme();
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = getIcon(title);

  // Determine if menu item is active
  // Normalize pathnames by removing trailing slashes for comparison
  const normalizePath = (path: string | undefined) => {
    if (!path) return "";
    // Remove trailing slash and ensure it starts with /
    const normalized = path.replace(/\/$/, "");
    return normalized || "/";
  };

  const currentPath = normalizePath(location.pathname);
  const routePath = normalizePath(route);

  // Check if the current path matches the route exactly
  // This ensures the menu item is highlighted when on that page, including on refresh
  const isActive = activeRoutes
    ? activeRoutes.some((r) => normalizePath(r) === currentPath)
    : routePath && routePath === currentPath;

  // Determine icon/text color
  const iconColor = isActive
    ? "#ffffff"
    : isHovered
    ? "#ffffff"
    : theme === "dark"
    ? "#ffffff"
    : "#1f2937";

  // Special handling for Logout hover color
  const logoutHoverBg = title === "Logout" ? "#dc2626" : "var(--sidebar-hover)";

  const handleClick = (e: React.MouseEvent) => {
    // If button has onClick handler, call it
    if (isButton && onClick) {
      onClick(e);
      return;
    }

    // If already on the route, trigger a refresh event
    const currentPath = normalizePath(location.pathname);
    const routePath = normalizePath(route);
    if (currentPath === routePath && route === "/cognitive") {
      e.preventDefault();
      window.dispatchEvent(new Event("cognitive-refresh"));
    }
  };

  const layoutClasses = isSideBarOpen
    ? "justify-start gap-4 px-3 py-2"
    : "justify-center gap-0 px-1.5 py-2";

  const commonClassName = `flex items-center w-full rounded-lg sm:rounded-xl transition-colors duration-200 ${layoutClasses} ${
    isButton ? "" : "group"
  }`;

  const commonStyle = {
    backgroundColor: isActive
      ? title === "Logout"
        ? "transparent"
        : "var(--sidebar-active)"
      : "transparent",
    color: isActive ? "#ffffff" : "var(--sidebar-text)",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    setIsHovered(true);
    if (!isActive) {
      e.currentTarget.style.backgroundColor = logoutHoverBg;
      e.currentTarget.style.color = "#ffffff";
      if (spanRef.current) {
        spanRef.current.style.color = "#ffffff";
      }
    } else if (title === "Logout") {
      // Logout always shows red background on hover
      e.currentTarget.style.backgroundColor = "#dc2626";
      e.currentTarget.style.color = "#ffffff";
      if (spanRef.current) {
        spanRef.current.style.color = "#ffffff";
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    setIsHovered(false);
    if (!isActive) {
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = "var(--sidebar-text)";
      if (spanRef.current) {
        spanRef.current.style.color = theme === "dark" ? "#ffffff" : "#1f2937";
      }
    } else if (title === "Logout") {
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = iconColor;
      if (spanRef.current) {
        spanRef.current.style.color = iconColor;
      }
    }
  };

  // Render icon or avatar
  const renderIcon = () => {
    if (avatar) {
      return (
        <Avatar
          className=""
          size={32}
          icon={
            <img
              src={`${
                import.meta.env.BASE_URL
              }layout/user/left-sidebar/user-image.jpg`}
              alt="Profile icon"
              className="!w-6 !h-6 sm:!w-7 sm:!h-7 md:!w-8 md:!h-8 !rounded-full"
            />
          }
          style={{ backgroundColor: "var(--sidebar-avatar-bg)" }}
        />
      );
    }

    if (IconComponent) {
      return (
        <IconComponent
          className="w-5 h-5 transition-colors duration-200"
          style={{
            color: iconColor,
          }}
        />
      );
    }

    return null;
  };

  // If it's a button (Logout), render button instead of Link
  if (isButton) {
    return (
      <button
        onClick={handleClick}
        className={commonClassName}
        style={commonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderIcon()}

        {isSideBarOpen && (
          <span
            ref={spanRef}
            className="text-base font-medium"
            style={{
              color: iconColor,
              fontSize: "14px",
            }}
          >
            {title}
          </span>
        )}
      </button>
    );
  }

  // Regular Link component
  return (
    <Link
      to={route || "#"}
      onClick={handleClick}
      className={commonClassName}
      style={commonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderIcon()}

      {isSideBarOpen && (
        <span
          ref={spanRef}
          className={`text-base font-medium ${
            isActive ? "text-white" : "text-gray-800 group-hover:text-white"
          }`}
          style={{
            color: iconColor,
            fontSize: "14px",
          }}
        >
          {title}
        </span>
      )}
    </Link>
  );
}
