/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from "react-router-dom";
import { Card, Col, Row, Tag, Typography, notification, Button, Modal, Progress } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import {
  fetchAssessmentSummary,
  startAssessment,
} from "../../services/questionTypesApi";
import {
  setAssessmentStarted,
  setAssessmentStartLoading,
  setAssessmentStartError,
  setAssessmentSummary,
} from "../../store/miscSlice";
import { useEffect, useState } from "react";

const { Title, Paragraph } = Typography;

const mergeSectionsWithQuestionIds = (
  baseSections: any[] = [],
  incomingSections: any[] = []
) => {
  const sectionMap = new Map<string, any>();

  const cloneSection = (section: any) => {
    if (!section) return null;
    return {
      ...section,
      question_types: Array.isArray(section.question_types)
        ? section.question_types.map((qt: any) => ({
            ...qt,
            question_ids: Array.isArray(qt?.question_ids)
              ? [...qt.question_ids]
              : [],
          }))
        : [],
    };
  };

  const upsertSection = (section: any) => {
    if (!section) return;
    const key =
      section.section_id ||
      section.section_name ||
      `section-${sectionMap.size}`;
    const existing = sectionMap.get(key) || cloneSection(section) || {};

    const typeMap = new Map<string, any>();

    const addQuestionTypes = (types: any[], sourceSectionId?: string) => {
      if (!Array.isArray(types)) {
        return;
      }

      types.forEach((qt: any) => {
        const typeCode = qt?.type;
        if (!typeCode) {
          return;
        }

        const current = typeMap.get(typeCode) || {
          ...qt,
          question_ids: [],
          count: qt?.count || 0,
        };

        const incomingIds = Array.isArray(qt?.question_ids)
          ? qt.question_ids
          : [];

        incomingIds.forEach((id: string) => {
          if (id && !current.question_ids.includes(id)) {
            current.question_ids.push(id);
          }
        });

        current.count = Math.max(
          current.count || 0,
          qt?.count || current.question_ids.length
        );

        if (!current.section_id && sourceSectionId) {
          current.section_id = sourceSectionId;
        }

        typeMap.set(typeCode, current);
      });
    };

    addQuestionTypes(existing.question_types, existing.section_id);
    addQuestionTypes(section.question_types, section.section_id);

    sectionMap.set(key, {
      ...existing,
      ...section,
      question_types: Array.from(typeMap.values()),
    });
  };

  baseSections.forEach((section) => upsertSection(section));
  incomingSections.forEach((section) => upsertSection(section));

  return Array.from(sectionMap.values());
};

export default function Section1Instruction() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { candidate_id } = useParams();
  const storedCandidateId = useSelector(
    (state: any) => state.misc.candidate_id
  );

  // Redux store data
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );
  const questionTypes = useSelector((state: any) => state.misc?.questionTypes);
  const assessmentSummaryLoading = useSelector(
    (state: any) => state.misc?.assessmentSummaryLoading
  );
  const questionTypesLoading = useSelector(
    (state: any) => state.misc?.questionTypesLoading
  );
  const authToken = useSelector((state: any) => state.misc?.authToken);
  const assessmentStartLoading = useSelector(
    (state: any) => state.misc?.assessmentStartLoading
  );

  // Fullscreen functionality
  const { isSupported: isFullscreenSupported, enterFullscreen, isFullscreen } = useFullscreen();
  const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(7);

  // Helper functions to get section-specific data
  const getSection1Data = () => {
    if (
      !assessmentSummary?.sections ||
      !Array.isArray(assessmentSummary.sections)
    ) {
      return {
        questionCount: 0,
        duration: 0,
        questionTypes: [],
        sectionName: "Section 1 Instructions",
      };
    }

    const section1 = assessmentSummary.sections[0]; // First section
    if (!section1) {
      return {
        questionCount: 0,
        duration: 0,
        questionTypes: [],
        sectionName: "Section 1 Instructions",
      };
    }

    // Calculate total question count - sum all counts from question_types
    const uniqueQuestionIds = new Set<string>();

    section1.question_types?.forEach((qt: any) => {
      if (Array.isArray(qt?.question_ids)) {
        qt.question_ids.forEach((id: string) => {
          if (id) {
            uniqueQuestionIds.add(id);
          }
        });
      }
    });

    const fallbackQuestionCount =
      section1.question_types?.reduce(
        (sum: number, qt: any) => sum + (qt.count || 0),
        0
      ) || 0;

    const questionCount =
      uniqueQuestionIds.size > 0
        ? uniqueQuestionIds.size
        : fallbackQuestionCount;
    const duration = section1.duration_minutes || 0;
    const sectionName = section1.section_name || "Section 1 Instructions";

    // Get unique question type names for this section
    const uniqueQuestionTypes = new Set();
    const sectionQuestionTypes: string[] = [];

    section1.question_types?.forEach((qt: any) => {
      if (qt.type && !uniqueQuestionTypes.has(qt.type)) {
        uniqueQuestionTypes.add(qt.type);
        const questionType = questionTypes?.find(
          (q: any) => q.code === qt.type
        );
        if (questionType && questionType.display_name) {
          sectionQuestionTypes.push(questionType.display_name);
        } else {
          sectionQuestionTypes.push(qt.type); // fallback to type code
        }
      }
    });

    console.log("Section 1 Data:", {
      section1,
      questionCount,
      duration,
      sectionName,
      sectionQuestionTypes,
      questionTypes,
    });

    return {
      questionCount,
      duration,
      questionTypes: sectionQuestionTypes,
      sectionName,
    };
  };

  // Handle Start Test button click
  const handleStartTest = async () => {
    if (!authToken) {
      notification.error({
        message: "Authentication Error",
        description:
          "No authentication token found. Please refresh the page and try again.",
        duration: 5,
      });
      return;
    }

    try {
      dispatch(setAssessmentStartLoading(true));
      console.log("Starting assessment...");

      const response = await startAssessment(authToken);
      console.log("Assessment started successfully:", response);

      dispatch(setAssessmentStarted(response));

      if (response?.assessment_summary) {
        dispatch(setAssessmentSummary(response.assessment_summary));
      } else {
        const sectionsFromStart = Array.isArray(response?.sections)
          ? response.sections
          : Array.isArray(response?.data?.sections)
          ? response.data.sections
          : [];

        if (sectionsFromStart.length > 0) {
          const mergedSections = mergeSectionsWithQuestionIds(
            assessmentSummary?.sections,
            sectionsFromStart
          );

          if (assessmentSummary) {
            dispatch(
              setAssessmentSummary({
                ...assessmentSummary,
                sections: mergedSections,
              })
            );
          } else {
            dispatch(
              setAssessmentSummary({
                assessment_name: response?.assessment_name || "",
                assessment_overview: response?.assessment_overview || {},
                sections: mergedSections,
                storage_path: response?.storage_path || "",
                presigned_urls: response?.presigned_urls || {},
              })
            );
          }
        }
      }

      try {
        const updatedSummary = await fetchAssessmentSummary(authToken);
        if (updatedSummary) {
          // Get the section_id from localStorage (set by SectionSelection)
          const candidateId = storedCandidateId || candidate_id;
          const storedSectionId = localStorage.getItem(`selected_section_id_${candidateId}`);
          
          // Find Section 1 by section_id from localStorage, or fallback to index 0
          let section1 = null;
          if (storedSectionId) {
            section1 = updatedSummary?.sections?.find((s: any) => s.section_id === storedSectionId);
            console.log("✅ Found section from localStorage:", storedSectionId, section1);
          }
          
          // If not found by section_id, try to find by section_order = 1
          if (!section1) {
            section1 = updatedSummary?.sections?.find((s: any) => s.section_order === 1);
            console.log("✅ Found section by section_order:", section1);
          }
          
          // Last fallback: use index 0
          if (!section1 && updatedSummary?.sections?.length > 0) {
            section1 = updatedSummary.sections[0];
            console.log("✅ Using section at index 0 as fallback:", section1);
          }
          
          if (section1?.section_id) {
            // Store section_id in localStorage for Test.tsx to use
            localStorage.setItem(`selected_section_id_${candidateId}`, section1.section_id);
            
            // Update metadata to indicate Section 1 is current
            const updatedSummaryWithSection1: any = {
              ...updatedSummary,
              metadata: {
                ...(updatedSummary as any)?.metadata,
                current_section_id: section1.section_id,
              },
            };
            dispatch(setAssessmentSummary(updatedSummaryWithSection1));
            console.log("✅ Set Section 1 as current section:", section1.section_id);
          } else {
            dispatch(setAssessmentSummary(updatedSummary));
            console.warn("⚠️ Could not find Section 1 in assessment summary");
          }
        } else {
          console.warn("⚠️ Assessment summary is null after fetch");
        }
      } catch (summaryError) {
        console.error(
          "Failed to refresh assessment summary after start:",
          summaryError
        );
        // Don't block navigation if summary fetch fails - it will be fetched on test page
      }

      // Ensure assessment summary is in Redux before navigating
      if (!response?.assessment_summary && !assessmentSummary) {
        console.warn("⚠️ No assessment summary available, will fetch on test page");
      }

      notification.success({
        message: "Assessment Started",
        description:
          "Your assessment has been started successfully. You can now begin the test.",
        duration: 3,
      });

      // Small delay to ensure Redux state is updated
      setTimeout(() => {
        navigate(`/${storedCandidateId || candidate_id}/test`);
      }, 100);
    } catch (error) {
      console.error("Error starting assessment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start assessment";

      dispatch(setAssessmentStartError(errorMessage));

      notification.error({
        message: "Failed to Start Assessment",
        description: errorMessage,
        duration: 5,
      });
    } finally {
      dispatch(setAssessmentStartLoading(false));
    }
  };

  // Secure mode hook
  useSecureMode();

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
      setFullscreenCountdown(7);
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
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              {assessmentSummaryLoading || questionTypesLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                getSection1Data().sectionName
              )}
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Pay attention to section details and timing. Follow instructions
              for a fair test.
            </p>
          </div>

          <Card
            title={
              <Row align="middle" justify="start" gutter={10}>
                <Col>
                  <img
                    src={`${import.meta.env.BASE_URL}assessment/file-text.svg`}
                    alt="File text"
                  />
                </Col>
                <Col>Technical Skills</Col>
              </Row>
            }
            extra={
              <Tag className="!px-4 !py-1 !rounded-2xl !text-[#C4B5FD] !border !border-[#C4B5FD]">
                Section 1
              </Tag>
            }
            className="!bg-[#000000] !rounded-2xl w-full max-w-2xl"
          >
            <div className="flex flex-col gap-2 sm:gap-3">
              <Card className="!rounded-2xl !border-none !bg-[#1F222AA6] relative overflow-hidden">
                {/* Bottom-left radial gradient overlay */}
                <div className="absolute -bottom-20 left-5 w-40 h-40 bg-[#7C3AED] opacity-60 rounded-full blur-3xl z-0" />

                {/* Content */}
                <Row align="middle" justify="start" className="relative z-10">
                  <Col flex="none">
                    <img
                      src={`${
                        import.meta.env.BASE_URL
                      }assessment/clipboard-with-checklist-paper-note.png`}
                      alt="clipboard-with-checklist-paper-note"
                      className="w-30 h-25"
                    />
                  </Col>

                  <Col flex="1">
                    <Title className="!text-[16px]">
                      Know the Test Structure
                    </Title>

                    <span
                      className="!text-xs md:!text-sm !mb-0"
                      style={{ color: "white" }}
                    >
                      {assessmentSummaryLoading || questionTypesLoading ? (
                        <span className="animate-pulse">
                          Loading section details...
                        </span>
                      ) : (
                        <>
                          This section has{" "}
                          <span className="text-[#E1BCFF] text-lg font-bold">
                            {getSection1Data().questionCount} questions
                          </span>{" "}
                          and you will have{" "}
                          <span className="text-[#E1BCFF] text-lg font-bold">
                            {getSection1Data().duration} minutes
                          </span>{" "}
                          to complete it.
                        </>
                      )}
                    </span>
                  </Col>
                </Row>
              </Card>

              <Card className="!rounded-2xl !border-none !bg-[#1F222AA6] relative overflow-hidden">
                {/* Bottom-left radial gradient overlay */}
                <div className="absolute -bottom-20 left-5 w-40 h-40 bg-[#EAB300] opacity-60 rounded-full blur-3xl z-0" />

                {/* Content */}
                <Row align="middle" justify="start" className="relative z-10">
                  <Col flex="none">
                    <img
                      src={`${
                        import.meta.env.BASE_URL
                      }assessment/red-alarm-clock-with-yellow-arrow.png`}
                      alt="red-alarm-clock-with-yellow-arrow"
                      className="w-30 h-25"
                    />
                  </Col>

                  <Col flex="1">
                    <Title className="!text-[16px]">Auto-End of Section</Title>

                    <span>
                      The section will submit automatically when the timer runs
                      out.
                    </span>
                  </Col>
                </Row>
              </Card>

              <span className="font-semibold text-white text-sm sm:text-base">
                {assessmentSummaryLoading || questionTypesLoading ? (
                  <span className="animate-pulse">
                    Loading question types...
                  </span>
                ) : (
                  `${getSection1Data().questionTypes.length} Question types`
                )}
              </span>

              <Row align="middle" justify="start" gutter={[8, 8]}>
                {assessmentSummaryLoading || questionTypesLoading ? (
                  <Col>
                    <span className="animate-pulse text-gray-400">
                      Loading...
                    </span>
                  </Col>
                ) : (
                  getSection1Data().questionTypes.map(
                    (questionType: string, index: number) => (
                      <Col key={index}>
                        <Tag className="!flex items-center gap-2 !px-3 !py-2 !rounded-[10px] !bg-[#1F222A] !border-none !text-white !text-xs">
                          <img
                            src={`${
                              import.meta.env.BASE_URL
                            }assessment/list-bullets.svg`}
                            alt="question-type"
                            className="w-4 h-4"
                          />
                          <span>{questionType}</span>
                        </Tag>
                      </Col>
                    )
                  )
                )}
              </Row>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end pt-2 sm:pt-3 gap-2 sm:gap-3 w-full max-w-2xl">
            <button
              type="button"
              className="order-2 sm:order-1 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] h-10 sm:h-12 bg-[#272727] border-none font-normal text-white rounded-lg sm:rounded-xl hover:bg-[#333333] cursor-pointer"
              onClick={() => navigate(-1)}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleStartTest}
              disabled={assessmentStartLoading}
              className={`flex items-center justify-center order-1 sm:order-2 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] h-10 sm:h-12 border-none font-normal text-white rounded-lg sm:rounded-xl cursor-pointer transition-colors ${
                assessmentStartLoading
                  ? "bg-[#4C4C4C] text-[#888888] cursor-not-allowed"
                  : "bg-[#5843EE] hover:bg-[#6B52F0]"
              }`}
            >
              {assessmentStartLoading ? "Starting..." : "Start Test"}
            </button>
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
