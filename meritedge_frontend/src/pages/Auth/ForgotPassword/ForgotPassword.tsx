/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const { Title, Text } = Typography;

// API
import { forgotPassword } from "../../../lib/api";

// Components
import ThemeToggle from "../../../components/ui/ThemeToggle";

// Context
import { useTheme } from "../../../context/ThemeContext";

export default function ForgotPassword() {
    const { theme } = useTheme();
    const [forgotPasswordForm] = Form.useForm();
    const [isResetLinkLoading, setIsResetLinkLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (values: any) => {
        try {
            setIsResetLinkLoading(true);
            const response = await forgotPassword(values.email);

            if (response?.success) {
                const messageText = response.data?.message || "Password reset instructions have been sent to your email.";
                toast.success(messageText);
                forgotPasswordForm.resetFields();
                // Optionally redirect back to login after success
                setTimeout(() => navigate("/"), 2000);
            } else {
                const errorMessage =
                    response?.data?.message ||
                    response?.data?.detail ||
                    "Failed to send reset link. Please try again.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsResetLinkLoading(false);
        }
    };

    return (
        <div 
            className="relative w-screen h-screen overflow-hidden" 
            style={{ backgroundColor: theme === "light" ? "#ffffff" : "#000000" }}
        >
            {/* Video Background - Only show in dark theme */}
            {theme === "dark" && (
                <video
                    className="absolute top-0 left-0 w-full h-full object-cover z-0"
                    autoPlay
                    muted
                    loop
                >
                    <source
                        src={`${import.meta.env.BASE_URL}login/dark-swirling.mp4`}
                        type="video/mp4"
                    />
                    Your browser does not support the video tag.
                </video>
            )}

            {/* Light theme background gradient */}
            {theme === "light" && (
                <div className="absolute top-0 left-0 w-full h-full z-0 bg-gradient-to-br from-purple-50 via-white to-blue-50" />
            )}

            {/* Top-Left Logo */}
            <div className="absolute top-12 left-12 z-20">
                <img 
                    src={`${import.meta.env.BASE_URL}${
                        theme === "light"
                            ? "common/otomeyt-ai-logo-light.svg"
                            : "common/otomeyt-ai-logo.svg"
                    }`} 
                    alt="Otomeyt AI Logo" 
                    className="h-10 w-auto"
                    key={theme}
                    onError={(e) => {
                        e.currentTarget.src = `${import.meta.env.BASE_URL}common/otomeyt-ai-logo.svg`;
                    }}
                />
            </div>

            {/* Top-Right Theme Toggle */}
            <div className="absolute top-12 right-12 z-20">
                <ThemeToggle
                    className={`hover:!text-[#7C3AED] hover:!border-[#7C3AED] !border ${
                        theme === "dark"
                            ? "!text-white !border-white/30"
                            : "!text-gray-800 !border-gray-300"
                    }`}
                    style={{
                        color: theme === "dark" ? "#ffffff" : "#1f2937",
                        borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "#d1d5db",
                    }}
                />
            </div>

            <div className="flex flex-row min-h-screen justify-center items-center p-4">
                <div 
                    className="inline-flex backdrop-blur-[15px] 
                    w-full max-w-[320px] h-auto min-h-[400px]
                    sm:max-w-[450px] sm:min-h-[450px]
                    md:max-w-[550px] md:min-h-[500px]
                    lg:max-w-[600px] lg:min-h-[500px]
                    xl:w-[650px] xl:h-[550px]
                    p-6 sm:p-8 md:p-10 lg:p-12 
                    border rounded-3xl
                    flex-col items-center justify-center"
                    style={{
                        borderColor: theme === "dark" ? "#362F5E" : "#e5e7eb",
                        backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(15px)",
                        WebkitBackdropFilter: "blur(15px)",
                    }}
                >

                    {/* Forgot Password Form */}
                    <div className="flex flex-col w-full items-center justify-center gap-6 sm:gap-7 md:gap-8">
                        {/* Header */}
                        <div className="inline-flex flex-col items-center justify-center gap-3 text-center">
                            <Title 
                                level={2} 
                                className="text-2xl sm:text-3xl md:text-4xl !mb-0"
                                style={{ color: theme === "dark" ? "#ffffff" : "#1f2937" }}
                            >
                                Forgot Password?
                            </Title>
                            <Text 
                                className="text-sm sm:text-base md:text-lg max-w-md"
                                style={{ color: theme === "dark" ? "#c2c2c2" : "#6b7280" }}
                            >
                                Enter your registered email address and we'll send you a password reset link.
                            </Text>
                        </div>

                        {/* Form */}
                        <Form
                            form={forgotPasswordForm}
                            layout="vertical"
                            onFinish={handleForgotPassword}
                            className="flex flex-col items-start gap-5 w-full max-w-md"
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: "Email is required" },
                                    { type: "email", message: "Please enter a valid email" }
                                ]}
                                className="!mb-0 w-full"
                            >
                                <Input
                                    prefix={<img src={`${import.meta.env.BASE_URL}login/envelope-simple.svg`} alt="Email" />}
                                    placeholder="Enter your email"
                                    className="!h-12 sm:!h-14 !pl-5 !rounded-xl [&>input::placeholder]:!text-[#9CA3AF]"
                                    style={{
                                        color: theme === "dark" ? "#ffffff" : "#1f2937",
                                        backgroundColor: theme === "dark" ? "#1D1D23" : "#ffffff",
                                        borderColor: theme === "dark" ? "#23263C" : "#d1d5db",
                                    }}
                                    autoComplete="email"
                                />
                            </Form.Item>

                            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full">
                                <Button
                                    onClick={() => navigate("/")}
                                    className={`flex-1 !h-12 sm:!h-14 !rounded-xl ${
                                        theme === "dark"
                                            ? "!bg-[#2A2A2E] !border-[#4B5563] !text-white hover:!bg-[#3A3A3E] hover:!border-[#5B6573]"
                                            : "!bg-gray-100 !border-gray-300 !text-gray-800 hover:!bg-gray-200 hover:!border-gray-400"
                                    }`}
                                >
                                    Back to Login
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isResetLinkLoading}
                                    className="flex-1 !h-12 sm:!h-14 !rounded-xl !bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6D28D9]"
                                >
                                    {isResetLinkLoading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </div>
                        </Form>

                        {/* Additional Help Text */}
                        <div className="text-center mt-4">
                            <Text 
                                className="text-xs sm:text-sm"
                                style={{ color: theme === "dark" ? "#c2c2c2" : "#6b7280" }}
                            >
                                Remember your password?{' '}
                                <span 
                                    className="!text-[#7C3AED] cursor-pointer hover:!text-[#6D28D9] transition-colors"
                                    onClick={() => navigate("/")}
                                >
                                    Login here
                                </span>
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

