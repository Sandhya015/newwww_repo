import React, { useContext } from 'react';
import { ConfigProvider, theme } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';

interface ThemeAwareConfigProps {
    children: React.ReactNode;
}

const ThemeAwareConfig: React.FC<ThemeAwareConfigProps> = ({ children }) => {
    const { theme: currentTheme } = useContext(ThemeContext);

    const isDark = currentTheme === 'dark';

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorBgContainer: isDark ? "#23242a" : "#ffffff",
                    colorText: isDark ? "#fff" : "#000",
                    colorPrimary: "#7C3AED",
                    colorBgLayout: isDark ? "#000000" : "#f5f5f5",
                    colorBgElevated: isDark ? "#1a1a1a" : "#ffffff",
                    colorBorder: isDark ? "#333" : "#d9d9d9",
                    colorBorderSecondary: isDark ? "#4B5563" : "#f0f0f0",
                    colorFill: isDark ? "#1a1a1a" : "#f5f5f5",
                    colorFillSecondary: isDark ? "#2a2a2a" : "#fafafa",
                    colorFillTertiary: isDark ? "#3a3a3a" : "#f0f0f0",
                    colorFillQuaternary: isDark ? "#4a4a4a" : "#e6e6e6",
                    colorSuccess: "#52c41a",
                    colorWarning: "#faad14",
                    colorError: "#ff4d4f",
                    colorInfo: "#1890ff",
                    borderRadius: 6,
                    wireframe: false,
                },
                components: {
                    Table: {
                        headerBg: isDark ? "#000000" : "#fafafa",
                        headerColor: isDark ? "#9CA3AF" : "#262626",
                        rowHoverBg: isDark ? "#1a1a1a" : "#f5f5f5",
                        colorBgContainer: isDark ? "#0d0d0d" : "#ffffff",
                        colorText: isDark ? "#fff" : "#000",
                        borderColor: isDark ? "#4B5563" : "#f0f0f0",
                    },
                    Input: {
                        colorBgContainer: isDark ? "#1D1D23" : "#ffffff",
                        colorText: isDark ? "#fff" : "#000",
                        colorBorder: isDark ? "#23263C" : "#d9d9d9",
                        colorTextPlaceholder: isDark ? "#8c8c8c" : "#bfbfbf",
                    },
                    Select: {
                        colorBgContainer: isDark ? "#1D1D23" : "#ffffff",
                        colorText: isDark ? "#fff" : "#000",
                        colorBorder: isDark ? "#23263C" : "#d9d9d9",
                        colorTextPlaceholder: isDark ? "#8c8c8c" : "#bfbfbf",
                    },
                    Modal: {
                        colorBgElevated: isDark ? "#030206" : "#ffffff",
                        colorText: isDark ? "#fff" : "#000",
                        colorBorder: isDark ? "#F8F7F9" : "#d9d9d9",
                    },
                    Button: {
                        colorBgContainer: isDark ? "#780dea" : "#7C3AED",
                        colorText: isDark ? "#fff" : "#fff",
                        colorBorder: isDark ? "#780dea" : "#7C3AED",
                    },
                    Checkbox: {
                        colorBgContainer: isDark ? "#030206" : "#ffffff",
                        colorBorder: isDark ? "#4B5563" : "#d9d9d9",
                    },
                    Upload: {
                        colorBgContainer: isDark ? "#1D1D23" : "#ffffff",
                        colorBorder: isDark ? "#23263C" : "#d9d9d9",
                    },
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
};

export default ThemeAwareConfig;
