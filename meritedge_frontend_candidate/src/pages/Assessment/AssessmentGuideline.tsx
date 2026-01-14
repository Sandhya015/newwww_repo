/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Col, Progress, Row, Typography, Button, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";

const { Title, Text, Paragraph } = Typography;

export default function AssessmentGuideline() {
  const navigate = useNavigate();
  const { candidate_id } = useParams();
  const storedCandidateId = useSelector(
    (state: any) => state.misc.candidate_id
  );

  // Redux store data
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );
  const assessmentSummaryLoading = useSelector(
    (state: any) => state.misc?.assessmentSummaryLoading
  );

  // Secure mode hook
  useSecureMode();

  // Helper functions to get dynamic data
  const getTotalDuration = () => {
    if (assessmentSummary?.assessment_overview?.total_duration_minutes) {
      return assessmentSummary.assessment_overview.total_duration_minutes;
    }
    return 0; // Fallback
  };

  const getTotalSections = () => {
    if (
      assessmentSummary?.sections &&
      Array.isArray(assessmentSummary.sections)
    ) {
      return assessmentSummary.sections.length;
    }
    return 0; // Fallback
  };

  const getTotalQuestions = () => {
    if (assessmentSummary?.assessment_overview?.total_questions) {
      return assessmentSummary.assessment_overview.total_questions;
    }
    return 0; // Fallback
  };

  const [percent, setPercent] = useState(100);
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(7);

  const { isSupported: isFullscreenSupported, enterFullscreen, isFullscreen } = useFullscreen();

  const navigateToSectionSelection = useCallback(() => {
    // Always navigate directly to Section 1 instructions (section selection removed)
    navigate(`/${storedCandidateId || candidate_id}/section-1-instructions`);
  }, [candidate_id, navigate, storedCandidateId]);

  useEffect(() => {
    const duration = 7000; // 9 seconds
    const startTime = performance.now();
    let frameId = null;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = 100 - (elapsed / duration) * 100;
      const floored = Math.max(Math.floor(progress), 0);

      setPercent((prev) => {
        // only update when the value visibly changes
        return prev !== floored ? floored : prev;
      });

      if (elapsed < duration) {
        frameId = requestAnimationFrame(animate);
      } else {
        setPercent(0);
        setIsCountdownComplete(true);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleNext = () => {
    if (!isCountdownComplete) {
      return;
    }
    // Navigate to section selection (or directly to section 1 if only one section)
    navigateToSectionSelection();
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preventTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, []);

  // Monitor fullscreen changes and show warning when user exits fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // If user exited fullscreen, show warning modal and start countdown
      if (!isCurrentlyFullscreen && isFullscreenSupported) {
        setShowFullscreenWarningModal(true);
        setFullscreenCountdown(7);
      } else if (isCurrentlyFullscreen) {
        // If fullscreen is re-entered, close modal and reset countdown
        setShowFullscreenWarningModal(false);
        setFullscreenCountdown(7);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreenSupported]);

  // Handle ESC key to prevent exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        setShowFullscreenWarningModal(true);
        setFullscreenCountdown(7);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Countdown timer for automatic fullscreen re-entry
  useEffect(() => {
    if (!showFullscreenWarningModal) {
      return;
    }

    // If countdown reaches 0, automatically re-enter fullscreen
    if (fullscreenCountdown <= 0) {
      const reenterFullscreen = async () => {
        try {
          await enterFullscreen();
          setShowFullscreenWarningModal(false);
          setFullscreenCountdown(7);
        } catch (error) {
          console.error("Error re-entering fullscreen:", error);
          // If re-entry fails, restart countdown
          setFullscreenCountdown(7);
        }
      };
      reenterFullscreen();
      return;
    }

    // Set up countdown timer
    const timer = setInterval(() => {
      setFullscreenCountdown((prev) => {
        const newValue = prev - 1;
        // When countdown reaches 0, trigger automatic re-entry
        if (newValue <= 0) {
          clearInterval(timer);
          // Automatically re-enter fullscreen
          const autoReenter = async () => {
            try {
              await enterFullscreen();
              setShowFullscreenWarningModal(false);
              setFullscreenCountdown(7);
            } catch (error) {
              console.error("Error re-entering fullscreen:", error);
              setFullscreenCountdown(7);
            }
          };
          autoReenter();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showFullscreenWarningModal, fullscreenCountdown, enterFullscreen]);

  // Handle re-entering fullscreen from warning modal
  const handleReenterFullscreen = async () => {
    try {
      await enterFullscreen();
      setShowFullscreenWarningModal(false);
    } catch (error) {
      console.error("Error re-entering fullscreen:", error);
    }
  };

    return (
        <div className="relative bg-black text-white overflow-hidden h-screen w-full m-0 p-0">
            {/* Logo - positioned at ultimate corner */}
            <div className="absolute top-0 left-0 z-30 p-4 sm:p-6 lg:p-8">
                <img
                    src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
                    alt="Logo"
                    className="h-8 sm:h-10 lg:h-auto max-w-[120px] sm:max-w-none"
                />
            </div>

            {/* Background Video */}
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
                <source src={`${import.meta.env.BASE_URL}common/getty-images.mp4`} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Background Glows */}
            <div className="absolute inset-0 overflow-hidden z-10">
                {/* Top-left Glow */}
                <div className="absolute w-80 h-80 -top-32 -left-32 bg-[#4f43b7] rounded-full blur-[172px] opacity-60" />
                {/* Bottom-right Glow */}
                <div className="absolute w-80 h-80 -bottom-32 -right-32 bg-[#4f43b7] rounded-full blur-[172px] opacity-60" />
            </div>

            {/* Main Container - Extended for fullscreen */}
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 lg:py-16 overflow-y-auto">

        {/* Main Content */}
        <div className="w-full max-w-7xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4 flex flex-col items-center gap-1.5">
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor="#2dd46d"
              trailColor="#ffffff36"
              className="!mb-2 w-full !max-w-xl transition-all duration-100 ease-linear"
            />

            <p className="text-white text-base sm:text-lg md:text-xl text-center font-medium leading-tight">
              Assessment Guidelines
              <br />
              <span className="text-xs sm:text-sm md:text-base font-normal">
                Follow these strictly to avoid disqualification. The test is
                monitored and fairness is enforced.
              </span>
            </p>
          </div>

          {/* Info Cards */}
          <Row gutter={[12, 12]} className="mb-2 sm:mb-3">
            <Col xs={24} sm={12} md={8}>
              <Card
                bordered={false}
                className="relative overflow-hidden border border-[#FFF] h-full"
                style={{
                  background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                  borderRadius: "20px",
                }}
              >
                <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />

                <Row align="middle" justify="space-between">
                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base"
                      style={{
                        color: "white",
                        opacity: 0.8,
                        marginBottom: "8px",
                      }}
                    >
                      Total Duration
                    </Title>
                    <Title
                      level={2}
                      className="!text-2xl md:!text-3xl"
                      style={{ color: "white", margin: 0 }}
                    >
                      {assessmentSummaryLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        getTotalDuration()
                      )}
                    </Title>
                    <Text
                      className="text-xs md:text-sm"
                      style={{ color: "white", opacity: 0.5 }}
                    >
                      Minutes Total
                    </Text>
                  </Col>

                  <Col className="bg-[#5555554D] rounded-xl p-3">
                    <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-7 h-7 m-2"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                bordered={false}
                className="relative overflow-hidden border border-[#FFF] h-full"
                style={{
                  background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                  borderRadius: "20px",
                }}
              >
                <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />

                <Row align="middle" justify="space-between">
                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base"
                      style={{
                        color: "white",
                        opacity: 0.8,
                        marginBottom: "8px",
                      }}
                    >
                      Total Section
                    </Title>
                    <Title
                      level={2}
                      className="!text-2xl md:!text-3xl"
                      style={{ color: "white", margin: 0 }}
                    >
                      {assessmentSummaryLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        getTotalSections()
                      )}
                    </Title>
                    <Text
                      className="text-xs md:text-sm"
                      style={{ color: "white", opacity: 0.5 }}
                    >
                      to Complete
                    </Text>
                  </Col>

                  <Col className="bg-[#5555554D] rounded-xl p-3">
                    <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-7 h-7 m-2"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                bordered={false}
                className="relative overflow-hidden border border-[#FFF] h-full"
                style={{
                  background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                  borderRadius: "20px",
                }}
              >
                <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />

                <Row align="middle" justify="space-between">
                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base"
                      style={{
                        color: "white",
                        opacity: 0.8,
                        marginBottom: "8px",
                      }}
                    >
                      Total Questions
                    </Title>
                    <Title
                      level={2}
                      className="!text-2xl md:!text-3xl"
                      style={{ color: "white", margin: 0 }}
                    >
                      {assessmentSummaryLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        getTotalQuestions()
                      )}
                    </Title>
                    <Text
                      className="text-xs md:text-sm"
                      style={{ color: "white", opacity: 0.5 }}
                    >
                      to Answer
                    </Text>
                  </Col>

                  <Col className="bg-[#5555554D] rounded-xl p-3">
                    <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-7 h-7 m-2"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Guideline Cards */}
          <Row gutter={[12, 12]} className="mb-2">
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="h-full"
                style={{ background: "#1f222aa6", borderRadius: "20px" }}
              >
                <Row
                  align="middle"
                  justify="start"
                  gutter={[20, 0]}
                  className="h-full"
                >
                  <Col
                    flex="none"
                    className="flex items-center justify-center bg-[#2563EB4D] rounded-xl p-3"
                  >
                    <div className="bg-[#2563EB] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-5 h-5 m-2"
                      />
                    </div>
                  </Col>

                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base !text-[#C7D8FF] !mb-2"
                    >
                      System Compatibility Check
                    </Title>
                    <Paragraph
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      Ensure your camera, microphone, and internet are
                      functioning. A system check will run before the test
                      begins.
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="h-full"
                style={{ background: "#1f222aa6", borderRadius: "20px" }}
              >
                <Row
                  align="top"
                  justify="start"
                  gutter={[20, 0]}
                  className="h-full"
                >
                  <Col
                    flex="none"
                    className="flex items-center justify-center bg-[#EB2C254D] rounded-xl p-3"
                  >
                    <div className="bg-[#F97B14] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-5 h-5 m-2"
                      />
                    </div>
                  </Col>

                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base !text-[#FFE0C7] !mb-2"
                    >
                      Proctoring in Effect
                    </Title>
                    <Paragraph
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      Live proctoring, screen tracking, and AI monitoring are
                      enabled — sit in a quiet, well-lit space.
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-3">
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="h-full"
                style={{ background: "#1f222aa6", borderRadius: "20px" }}
              >
                <Row
                  align="top"
                  justify="start"
                  gutter={[20, 0]}
                  className="h-full"
                >
                  <Col
                    flex="none"
                    className="flex items-center justify-center bg-[#EB25434D] rounded-xl p-3"
                  >
                    <div className="bg-[#EB2543] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-5 h-5 m-2"
                      />
                    </div>
                  </Col>

                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base !text-[#FFC7CF] !mb-2"
                    >
                      No Tab Switching
                    </Title>
                    <Paragraph
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      Switching tabs or minimizing the screen will be flagged
                      and may lead to disqualification.
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="h-full"
                style={{ background: "#1f222aa6", borderRadius: "20px" }}
              >
                <Row
                  align="top"
                  justify="start"
                  gutter={[20, 0]}
                  className="h-full"
                >
                  <Col
                    flex="none"
                    className="flex items-center justify-center bg-[#AC25EB4D] rounded-xl p-3"
                  >
                    <div className="bg-[#AC25EB] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-5 h-5 m-2"
                      />
                    </div>
                  </Col>

                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base !text-[#EDC7FF] !mb-2"
                    >
                      Avoid Page Refreshing
                    </Title>
                    <Paragraph
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      Do not refresh or close the browser during the test. It
                      may cause your session to end permanently.
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col span={24}>
              <Card
                bordered={false}
                style={{ background: "#1f222aa6", borderRadius: "20px" }}
              >
                <Row align="top" justify="start" gutter={[16, 0]}>
                  <Col
                    flex="none"
                    className="flex items-center justify-center bg-[#EBB9254D] rounded-xl p-3"
                  >
                    <div className="bg-[#EBB925] rounded-lg">
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }assessment/file-check-line.svg`}
                        alt="File check"
                        className="w-5 h-5 m-2"
                      />
                    </div>
                  </Col>

                  <Col flex="1">
                    <Title
                      level={5}
                      className="!text-sm md:!text-base !text-[#FFF1C7] !mb-2"
                    >
                      Stay Honest – No External Help
                    </Title>
                    <Paragraph
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      Avoid using phones, written notes, or getting outside
                      help. Any suspicious behavior is automatically flagged and
                      may lead to disqualification.
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

                {/* Next Button */}
                <div className="flex justify-center mt-4">
                    <Button
                        type="primary"
                        onClick={handleNext}
                        disabled={!isCountdownComplete}
                        className="!bg-[#5843EE] !border-none !rounded-lg !px-8 !py-3 !h-auto !font-semibold hover:!bg-[#6B52F0] disabled:!bg-[#4C4C4C] disabled:!text-[#888888]"
                        size="large"
                    >
                        {isCountdownComplete ? 'Next' : `Please wait... ${percent}%`}
                    </Button>
                </div>
            </div>
            </div>

            {/* Fullscreen Warning Modal - Shows when user exits fullscreen */}
            <Modal
                open={showFullscreenWarningModal}
                onCancel={() => {}}
                footer={null}
                closable={false}
                maskClosable={false}
                centered
                className="fullscreen-warning-modal"
                styles={{
                    content: {
                        backgroundColor: "#0a0a0a",
                        border: "2px solid #ef4444",
                        borderRadius: "12px",
                    },
                }}
            >
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                        <svg 
                            className="w-8 h-8 text-red-500" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                            />
                        </svg>
                    </div>
                    <Title level={3} className="!text-white !text-2xl !mb-4">
                        Fullscreen Mode Required
                    </Title>
                    <Paragraph className="!text-white !text-base !mb-2">
                        You are not supposed to exit fullscreen mode during the assessment.
                    </Paragraph>
                    <Paragraph className="!text-white !text-base !mb-6">
                        Returning to fullscreen automatically in <span className="!text-red-500 !font-bold !text-lg">{fullscreenCountdown}</span> seconds.
                    </Paragraph>
                    <div className="w-full max-w-xs mb-6">
                        <Progress 
                            percent={((7 - fullscreenCountdown) / 7) * 100} 
                            strokeColor="#ef4444"
                            trailColor="#ffffff36"
                            showInfo={false}
                        />
                    </div>
                    <Button
                        type="primary"
                        onClick={handleReenterFullscreen}
                        className="!bg-[#5843EE] !border-none !rounded-lg !px-8 !py-3 !h-auto !font-semibold hover:!bg-[#6B52F0]"
                        size="large"
                    >
                        Return to Fullscreen Now
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
