import { Button } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ThemeToggle({ className, style }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`${className || ""} hover:!text-[#7C3AED] hover:!border-[#7C3AED] [&_.anticon]:!text-inherit`}
      style={style}
    />
  );
}

