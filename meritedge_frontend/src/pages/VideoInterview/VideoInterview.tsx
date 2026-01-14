import React from "react";
import { useTheme } from "../../context/ThemeContext";

const VideoInterview: React.FC = () => {
  const { theme } = useTheme();
  const fontFamily = "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
  
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{
        backgroundColor: "var(--bg-primary)",
        fontFamily,
        zIndex: 10,
        position: "relative",
      }}
    >
      {/* Dark overlay to ensure text visibility */}
      {theme === "dark" && (
        <div 
          className="absolute inset-0 bg-black/40 z-0"
          style={{ pointerEvents: "none" }}
        />
      )}
      <div className="text-center relative z-10">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ 
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            fontFamily,
            textShadow: theme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.8)" : "none",
          }}
        >
          Video Interview
        </h1>
        <p
          className="text-lg"
          style={{ 
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            fontFamily,
            textShadow: theme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.8)" : "none",
          }}
        >
          Development is under progress
        </p>
      </div>
    </div>
  );
};

export default VideoInterview;

