/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Typography,
  Carousel,
} from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

// API
import { useHandleLoginWithPassword } from "../../../api/Auth/Auth";

// Components
import ThemeToggle from "../../../components/ui/ThemeToggle";

// Context
import { useTheme } from "../../../context/ThemeContext";

export default function Register() {
  const { theme } = useTheme();
    const [loginForm] = Form.useForm();
    const navigate = useNavigate();
    const [rememberMe, setRememberMe] = useState(false);

    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef(null);
  const {
    loginWithPassword,
    isLoginWithPasswordLoading,
    loginWithPasswordError,
  } = useHandleLoginWithPassword();

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem("remembered_email");
        if (rememberedEmail) {
            loginForm.setFieldsValue({ email: rememberedEmail });
            setRememberMe(true);
        }
    }, [loginForm]);

    const handleAddLogin = (formData: any) => {
        // Remember Me Feature:
        // 1. Our custom implementation saves/removes email to/from localStorage
        // 2. Browser's password manager auto-saves password when user clicks "Save" in browser prompt
        //    (this is triggered by proper form attributes: name, id, type, autoComplete)
        if (rememberMe) {
            localStorage.setItem("remembered_email", formData.email);
        } else {
            localStorage.removeItem("remembered_email");
        }
        loginWithPassword({ ...formData });
    };

    // Slider content data
    const sliderContent = [
        {
      title: "AI-Driven Talent Assessment",
            content: (
                <>
                    <p className="font-medium text-lg">
            Streamline candidate evaluation with intelligent automation.
                    </p>
                    <p>
            Leverage AI to efficiently screen, assess, and shortlist candidates,
            enhancing both speed and accuracy in the selection process.
                    </p>
                </>
      ),
        },
        {
      title: "Customizable Skill Assessments",
            content: (
                <>
                    <p className="font-medium text-lg">
            Assess candidates with precision and relevance.
                    </p>
                    <p>
            Automatically generate tailored assessments that align with your job
            specifications, ensuring every test is suited to the role without
            manual configuration.
                    </p>
                </>
      ),
        },
        {
      title: "Seamless Team Collaboration",
            content: (
                <>
                    <p className="font-medium text-lg">
            Enhance decision-making through streamlined collaboration.
                    </p>
                    <p>
            Easily invite team members to review assessments, share insights,
            and collaborate on hiring decisions, all within a unified platform.
                    </p>
                </>
      ),
    },
    ];

    const handleSlideChange = (current) => {
        setCurrentSlide(current);
    };

    const goToSlide = (slideIndex) => {
        if (carouselRef.current) {
            carouselRef.current.goTo(slideIndex);
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
            e.currentTarget.src = `${
              import.meta.env.BASE_URL
            }common/otomeyt-ai-logo.svg`;
          }}
        />
      </div>

      {/* Top-Right Theme Toggle */}
      <div className="absolute top-12 right-12 z-20">
        <ThemeToggle
          className={`hover:!text-[#7C3AED] hover:!border-[#7C3AED] !border`}
          style={{
            color: theme === "dark" ? "#ffffff" : "#1f2937",
            borderColor:
              theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "#d1d5db",
            backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.9)",
          }}
        />
            </div>

            <div className="flex flex-row min-h-screen justify-center items-center p-4">
        <div
          className="inline-flex backdrop-blur-[15px] 
                    w-full max-w-[320px] h-auto min-h-[400px]
                    sm:max-w-[500px] sm:min-h-[450px]
                    md:max-w-[700px] md:min-h-[500px]
                    lg:max-w-[900px] lg:min-h-[500px]
                    xl:w-[1000px] xl:h-[600px]
                    p-4 sm:p-6 md:p-8 lg:p-10 
                    gap-4 sm:gap-6 md:gap-[27px] 
                    border rounded-3xl
                    flex-col md:flex-row"
          style={{
            borderColor: theme === "dark" ? "#362F5E" : "#e5e7eb",
            backgroundColor:
              theme === "dark"
                ? "rgba(0, 0, 0, 0.3)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            WebkitBackdropFilter: "blur(15px)",
          }}
        >
                    <Row className="flex w-full md:w-[441px] items-end justify-center gap-[27px] px-[20px] sm:px-[30px] md:px-[50px] py-[20px] sm:py-[25px] md:py-[30px] relative self-stretch rounded-[20px] overflow-hidden">
            {/* Video - Only show in dark theme */}
            {theme === "dark" && (
                        <video
                            className="absolute top-0 left-0 w-full h-full object-cover z-0"
                            autoPlay
                            muted
                            loop
                        >
                            <source
                                src={`${import.meta.env.BASE_URL}login/getty-images.mp4`}
                                type="video/mp4"
                            />
                            Your browser does not support the video tag.
                        </video>
            )}

            {/* Light theme background for carousel panel */}
            {theme === "light" && (
              <div className="absolute top-0 left-0 w-full h-full z-0 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 rounded-[20px]" />
            )}

            <div
              className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none rounded-[20px]"
              style={{
                boxShadow:
                  theme === "dark"
                    ? "inset 0px 0px 94px #780dea57"
                    : "inset 0px 0px 94px rgba(124, 58, 237, 0.15)",
              }}
            />

                        <Col className="flex flex-col h-full items-start justify-center gap-3 sm:gap-4 md:gap-5 relative flex-1 grow z-10">
                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 w-full">
                                <Carousel
                                    ref={carouselRef}
                                    autoplay
                                    autoplaySpeed={3000}
                                    speed={300}
                                    dots={false}
                                    afterChange={handleSlideChange}
                                    swipeToSlide={true}
                                    touchMove={true}
                                    draggable={true}
                                    pauseOnHover={true}
                                    pauseOnDotsHover={true}
                                    className="w-full cursor-grab active:cursor-grabbing"
                  style={{ height: "auto" }}
                                >
                                    {sliderContent.map((slide, index) => (
                                        <div key={index}>
                                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 min-h-[200px] justify-center transition-all duration-300 ease-in-out">
                        <Title
                          level={2}
                          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl !mb-0 transform transition-transform duration-300"
                          style={{
                            color: theme === "light" ? "#1f2937" : "#ffffff",
                          }}
                        >
                          {slide.title.includes(" ") ? (
                            <>
                              {slide.title.split(" ")[0]} <br />
                              {slide.title.split(" ").slice(1).join(" ")}
                                                        </>
                                                    ) : (
                                                        slide.title
                                                    )}
                                                </Title>
                        <Text
                          className="text-sm sm:text-base transform transition-transform duration-300 delay-100"
                          style={{
                            color: theme === "light" ? "#4b5563" : "#ffffff",
                          }}
                        >
                                                    {slide.content}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </Carousel>

                {/* Custom Dots Indicator - Theme-aware */}
                                <div className="inline-flex items-center gap-0.5 relative flex-[0_0_auto] z-10">
                                    {sliderContent.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => goToSlide(index)}
                      className={`relative h-1.5 cursor-pointer transition-all duration-150 rounded-[3px] ${
                        index === currentSlide
                          ? "w-3.5 rounded-[60px]"
                          : "w-1.5 opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor:
                          theme === "light"
                            ? index === currentSlide
                              ? "#7C3AED"
                              : "#9ca3af"
                            : index === currentSlide
                            ? "#ffffff"
                            : "rgba(255, 255, 255, 0.6)",
                      }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Login Form */}
                    <Col className="flex flex-col w-full md:w-[421px] items-center justify-center gap-4 sm:gap-5 md:gap-[27px]">
                        <div className="inline-flex flex-col items-center justify-center gap-2.5 relative flex-[0_0_auto]">
              <Title
                level={3}
                className="text-lg sm:text-xl md:text-2xl"
                style={{ color: theme === "dark" ? "#ffffff" : "#1f2937" }}
              >
                                Login
                            </Title>
              <Text
                className="text-xs sm:text-sm text-center"
                style={{ color: theme === "dark" ? "#ffffff" : "#6b7280" }}
              >
                                AI-driven hiring. Smarter assessments. Faster decisions.
                            </Text>
                        </div>

                        <Form
                            form={loginForm}
                            layout="vertical"
                            onFinish={handleAddLogin}
                            className="flex flex-col items-start gap-[15px] relative self-stretch w-full flex-[0_0_auto]"
                            name="login-form"
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: "Email is required" },
                  { type: "email", message: "Please enter a valid email" },
                                ]}
                                className="!mb-0 w-full"
                            >
                                <Input
                                    type="email"
                                    id="login-email"
                                    name="email"
                  prefix={
                    <img
                      src={`${
                        import.meta.env.BASE_URL
                      }login/envelope-simple.svg`}
                    />
                  }
                                    placeholder="Work Email"
                  className="!h-10 sm:!h-12 !pl-5 !mt-2 !rounded-xl [&>input::placeholder]:!text-[#9CA3AF]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "#1f2937",
                    backgroundColor: theme === "dark" ? "#1D1D23" : "#ffffff",
                    borderColor: theme === "dark" ? "#23263C" : "#d1d5db",
                  }}
                                    autoComplete="email"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                rules={[{ required: true, message: "Password is required" }]}
                                className="!mb-0 w-full"
                            >
                                <Input.Password
                                    type="password"
                                    id="login-password"
                                    name="password"
                  prefix={
                    <img
                      src={`${import.meta.env.BASE_URL}login/lock-simple.svg`}
                    />
                  }
                                    placeholder="Password"
                  className={`!h-10 sm:!h-12 !pl-5 !mt-2 !rounded-xl [&>input::placeholder]:!text-[#9CA3AF] ${
                    theme === "dark"
                      ? "[&_.ant-input-password-icon]:!text-white"
                      : "[&_.ant-input-password-icon]:!text-gray-600"
                  }`}
                  style={{
                    color: theme === "dark" ? "#ffffff" : "#1f2937",
                    backgroundColor: theme === "dark" ? "#1D1D23" : "#ffffff",
                    borderColor: theme === "dark" ? "#23263C" : "#d1d5db",
                  }}
                                    autoComplete="current-password"
                                    onInput={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        input.value = input.value.replace(/\s/g, "");
                                    }}
                                />
                            </Form.Item>

                            {/* Error Message */}
                            {loginWithPasswordError && (
                                <div className="w-full">
                                    <Text className="!text-red-500 text-xs sm:text-sm">
                                        {loginWithPasswordError}
                                    </Text>
                                </div>
                            )}

                            <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                                <Checkbox 
                                    checked={rememberMe}
                                    onChange={(e) => {
                                        setRememberMe(e.target.checked);
                                        // When unchecking, clear the fields and remove saved email
                                        if (!e.target.checked) {
                                            localStorage.removeItem("remembered_email");
                                            loginForm.setFieldsValue({ email: "", password: "" });
                                        }
                                    }}
                  className={`text-xs sm:text-sm
                                    [&_.ant-checkbox-inner]:!rounded-md
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[#780DEA]
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[#780DEA]
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!border-white`}
                  style={{
                    color: theme === "dark" ? "#c2c2c2" : "#6b7280",
                  }}
                  rootClassName={
                    theme === "dark"
                      ? "[&_.ant-checkbox-inner]:!bg-[#030206] [&_.ant-checkbox-inner]:!border-[#4B5563]"
                      : "[&_.ant-checkbox-inner]:!bg-white [&_.ant-checkbox-inner]:!border-[#d1d5db]"
                  }
                >
                  Remember me
                </Checkbox>
                                <Text 
                  className="text-xs sm:text-sm cursor-pointer hover:!text-[#7C3AED] transition-colors"
                  style={{
                    color: theme === "dark" ? "#c2c2c2" : "#6b7280",
                  }}
                                    onClick={() => navigate("/forgot-password")}
                                >
                  Forgot Password?
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoginWithPasswordLoading}
                                className="w-full !bg-[#7C3AED] !rounded-xl !h-10 sm:!h-12"
                            >
                {isLoginWithPasswordLoading ? "Logging in..." : "Login"}
                            </Button>
                        </Form>
                    </Col>
                </div>
            </div>
        </div>
    );
}
