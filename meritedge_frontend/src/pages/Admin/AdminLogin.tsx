/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { Button, Form, Input, Typography, Carousel, Row, Col } from "antd";

const { Title, Text } = Typography;

// API
import { useHandleAdminLogin } from "../../api/Auth/AdminAuth";

export default function AdminLogin() {
    const [adminLoginForm] = Form.useForm();

    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef(null);
    const { adminLogin, isAdminLoginLoading, adminLoginError } = useHandleAdminLogin();

    const handleAdminLogin = (formData: any) => {
        adminLogin({ ...formData });
    };

    // Slider content data
    const sliderContent = [
        {
            title: "Admin Dashboard",
            content: (
                <>
                    <p className="font-medium text-lg">
                        Complete control over your platform.
                    </p>
                    <p>
                        Manage users, monitor system performance, and configure platform settings with comprehensive admin tools.
                    </p>
                </>
            )
        },
        {
            title: "User Management",
            content: (
                <>
                    <p className="font-medium text-lg">
                        Centralized user administration.
                    </p>
                    <p>
                        Oversee user accounts, manage permissions, and maintain platform security from a single interface.
                    </p>
                </>
            )
        },
        {
            title: "System Analytics",
            content: (
                <>
                    <p className="font-medium text-lg">
                        Real-time platform insights.
                    </p>
                    <p>
                        Monitor system health, track usage patterns, and make data-driven decisions to optimize performance.
                    </p>
                </>
            )
        }
    ];

    const handleSlideChange = (current: number) => {
        setCurrentSlide(current);
    };

    const goToSlide = (slideIndex: number) => {
        if (carouselRef.current) {
            (carouselRef.current as any).goTo(slideIndex);
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden">
            {/* Video Background */}
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

            {/* Top-Left Logo */}
            <div className="absolute top-12 left-12 z-20">
                <img src={`${import.meta.env.BASE_URL}common/otomeyt-ai-logo.svg`} alt="Otomeyt AI Logo" className="h-10 w-auto" />
            </div>

            <div className="flex flex-row min-h-screen justify-center items-center p-4">
                <div className="inline-flex backdrop-blur-[15px] 
                    w-full max-w-[320px] h-auto min-h-[400px]
                    sm:max-w-[500px] sm:min-h-[450px]
                    md:max-w-[700px] md:min-h-[500px]
                    lg:max-w-[900px] lg:min-h-[500px]
                    xl:w-[1000px] xl:h-[600px]
                    p-4 sm:p-6 md:p-8 lg:p-10 
                    gap-4 sm:gap-6 md:gap-[27px] 
                    border border-[#362F5E] rounded-3xl
                    flex-col md:flex-row">

                    <Row className="flex w-full md:w-[441px] items-end justify-center gap-[27px] px-[20px] sm:px-[30px] md:px-[50px] py-[20px] sm:py-[25px] md:py-[30px] relative self-stretch rounded-[20px] overflow-hidden">
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

                        <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none shadow-[inset_0px_0px_94px_#780dea57]" />

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
                                    style={{ height: 'auto' }}
                                >
                                    {sliderContent.map((slide, index) => (
                                        <div key={index}>
                                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 min-h-[200px] justify-center transition-all duration-300 ease-in-out">
                                                <Title level={1} className="!text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl !mb-0 transform transition-transform duration-300">
                                                    {slide.title.includes(' ') ? (
                                                        <>
                                                            {slide.title.split(' ')[0]} <br />
                                                            {slide.title.split(' ').slice(1).join(' ')}
                                                        </>
                                                    ) : (
                                                        slide.title
                                                    )}
                                                </Title>
                                                <Text className="!text-white text-sm sm:text-base transform transition-transform duration-300 delay-100">
                                                    {slide.content}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </Carousel>

                                {/* Custom Dots Indicator */}
                                <div className="inline-flex items-center gap-0.5 relative flex-[0_0_auto] z-10">
                                    {sliderContent.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            className={`relative h-1.5 cursor-pointer transition-all duration-150 ${index === currentSlide
                                                ? 'w-3.5 bg-white rounded-[60px]'
                                                : 'w-1.5 bg-white opacity-60 rounded-[3px] hover:opacity-100'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Admin Login Form */}
                    <Col className="flex flex-col w-full md:w-[421px] items-center justify-center gap-4 sm:gap-5 md:gap-[27px]">
                        <div className="inline-flex flex-col items-center justify-center gap-2.5 relative flex-[0_0_auto]">
                            <Title level={3} className="!text-white text-lg sm:text-xl md:text-2xl">
                                Admin Login
                            </Title>
                            <Text className="!text-white text-xs sm:text-sm text-center">
                                Access platform administration and management tools.
                            </Text>
                        </div>

                        <Form
                            form={adminLoginForm}
                            layout="vertical"
                            onFinish={handleAdminLogin}
                            className="flex flex-col items-start gap-[15px] relative self-stretch w-full flex-[0_0_auto]"
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
                                    placeholder="Admin Email"
                                    className="!h-10 sm:!h-12 !pl-5 !mt-2 !rounded-xl !text-white !bg-[#1D1D23] !border !border-[#23263C] !placeholder-[#ffffff] [&>input::placeholder]:!text-[#c2c2c2]"
                                    autoComplete="new-password"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: "Password is required" }
                                ]}
                                className="!mb-0 w-full"
                            >
                                <Input.Password
                                    prefix={<img src={`${import.meta.env.BASE_URL}login/lock-simple.svg`} alt="Password" />}
                                    placeholder="Admin Password"
                                    className="!h-10 sm:!h-12 !pl-5 !mt-2 !rounded-xl !text-white !bg-[#1D1D23] !border !border-[#23263C] !placeholder-[#ffffff] [&_.ant-input-password-icon]:!text-white [&>input::placeholder]:!text-[#c2c2c2]"
                                    autoComplete="new-password"
                                    onInput={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        input.value = input.value.replace(/\s/g, "");
                                    }}
                                />
                            </Form.Item>

                            {/* Error Message */}
                            {adminLoginError && (
                                <div className="w-full">
                                    <Text className="!text-red-500 text-xs sm:text-sm">
                                        {adminLoginError}
                                    </Text>
                                </div>
                            )}

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isAdminLoginLoading}
                                className="w-full !bg-[#7C3AED] !rounded-xl !h-10 sm:!h-12"
                            >
                                {isAdminLoginLoading ? 'Logging in...' : 'Admin Login'}
                            </Button>
                        </Form>
                    </Col>
                </div>
            </div>
        </div>
    );
}
