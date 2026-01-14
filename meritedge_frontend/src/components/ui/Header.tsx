import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Divider, Button } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

// Context
import { useTheme } from "../../context/ThemeContext";

// Store
import { selectUser } from "../../store/miscSlice";

// API
// import { useHandleProfileDetails } from "../../api/Profile/Profile";

export default function Header() {
  // Theme Context
  const { theme, setTheme } = useTheme();

  // Get user data from Redux store
  const user = useSelector(selectUser);

  // API Resume Parsing Details
  const hasFetchedProfileDetails = useRef<boolean>(false);

  // API Profile Details
  // const { profileDetails } = useHandleProfileDetails();

  const navigate = useNavigate();

  // Call API Resume Parsing Details And Profile Details
  useEffect(() => {
    if (
      localStorage.getItem("access_token") &&
      !hasFetchedProfileDetails.current
    ) {
      hasFetchedProfileDetails.current = true;

      // profileDetails();
    }
  }, [navigate, localStorage.getItem("access_token")]);

  return (
    <>
      <header
        className="relative z-10 flex flex-col justify-center rounded-none px-2 sm:px-3 md:px-4 lg:px-9 py-2 sm:py-3 p-px min-h-[60px] sm:min-h-[67px] w-full"
        style={{
          backgroundColor: "var(--header-bg)",
          borderColor: "var(--header-border)",
          borderWidth: "1px",
          borderStyle: "solid",
          overflow: "hidden",
        }}
      >
        <div className="relative flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-10 justify-between items-center w-full">
          <div className="flex gap-2 sm:gap-3 items-center text-base sm:text-lg md:text-xl w-full sm:w-auto justify-between sm:justify-start">
            <img
              src={`${import.meta.env.BASE_URL}${
                theme === "light"
                  ? "common/otomeyt-ai-logo-light.svg"
                  : "layout/otomeyt-ai-logo.svg"
              }`}
              className="object-contain shrink-0 w-32 h-auto"
              alt="Otomeyt AI Logo"
              key={theme} // Force re-render when theme changes
              onError={(e) => {
                console.log(
                  "Logo failed to load, falling back to dark theme logo"
                );
                e.currentTarget.src = `${
                  import.meta.env.BASE_URL
                }layout/otomeyt-ai-logo.svg`;
              }}
            />
            <Divider type="vertical" className="!h-6 sm:!h-8 hidden sm:block" />
            <span className="text-base color-[var(--header-text)]" style={{ fontSize: "18px" }}>
              Hey {user?.full_name || "Guest"}! 👋
            </span>
          </div>

          <div className="hidden sm:flex flex-row items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}common/tech-mahindra-logo.svg`}
              className="object-contain h-auto w-32"
              alt="Tech Mahindra Logo"
              onLoad={() => {
                console.log("Tech Mahindra logo loaded successfully");
              }}
              onError={(e) => {
                console.log(
                  "Tech Mahindra logo failed to load from:",
                  `${import.meta.env.BASE_URL}common/tech-mahindra-logo.svg`
                );
                // Fallback to PNG if SVG doesn't exist
                e.currentTarget.src = `${
                  import.meta.env.BASE_URL
                }common/tech-mahindra-logo.png`;
              }}
            />
            <Button
              type="text"
              icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:!text-[#7C3AED] hover:!border-[#7C3AED]"
              style={{
                color: "var(--header-text)",
                borderColor: "var(--header-button-border)",
              }}
            />
          </div>
        </div>
      </header>
    </>
  );
}
