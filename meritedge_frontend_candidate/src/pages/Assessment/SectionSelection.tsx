/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Col, Row, Typography, Button, Tag, notification, Progress } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
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

const { Title, Text, Paragraph } = Typography;

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

export default function SectionSelection() {
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
  const assessmentSummaryLoading = useSelector(
    (state: any) => state.misc?.assessmentSummaryLoading
  );
  const questionTypes = useSelector((state: any) => state.misc?.questionTypes);
  const questionTypesLoading = useSelector(
    (state: any) => state.misc?.questionTypesLoading
  );
  const authToken = useSelector((state: any) => state.misc?.authToken);
  const assessmentStartLoading = useSelector(
    (state: any) => state.misc?.assessmentStartLoading
  );
  
  // Track loading state per section to prevent refreshing other sections
  const [loadingSectionId, setLoadingSectionId] = useState<string | null>(null);

  // Secure mode hook
  useSecureMode();

  // Fullscreen hook
  const { isSupported: isFullscreenSupported, enterFullscreen, isFullscreen } = useFullscreen();

  // Fullscreen warning state
  const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(7);

  // Don't fetch assessment summary here - timer should start after assessment starts, not on section selection

  // Enter fullscreen on mount
  useEffect(() => {
    if (isFullscreenSupported && !isFullscreen) {
      enterFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    }
  }, [isFullscreenSupported, isFullscreen, enterFullscreen]);

  // Monitor fullscreen changes and show warning when user exits fullscreen
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen && isFullscreen) {
        setShowFullscreenWarningModal(true);
        setFullscreenCountdown(7);
      } else if (isCurrentlyFullscreen) {
        setShowFullscreenWarningModal(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        // Delay check to see if fullscreen was actually exited
        setTimeout(() => {
          const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
          );
          if (!isCurrentlyFullscreen) {
            setShowFullscreenWarningModal(true);
            setFullscreenCountdown(7);
          }
        }, 100);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Countdown timer for fullscreen warning
  useEffect(() => {
    if (!showFullscreenWarningModal) {
      return;
    }

    if (fullscreenCountdown > 0) {
      const timer = setTimeout(() => {
        setFullscreenCountdown(fullscreenCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto re-enter fullscreen after countdown
      enterFullscreen().catch((err) => {
        console.error("Failed to re-enter fullscreen:", err);
      });
      setShowFullscreenWarningModal(false);
    }
  }, [showFullscreenWarningModal, fullscreenCountdown, enterFullscreen]);

  // Get sections from assessment summary
  const getSections = () => {
    if (
      assessmentSummary?.sections &&
      Array.isArray(assessmentSummary.sections)
    ) {
      return assessmentSummary.sections;
    }
    return [];
  };

  // Check if a section is completed (from assessment summary API response)
  const isSectionCompleted = (sectionId: string) => {
    if (!assessmentSummary?.sections) return false;
    
    // Check if section has completion status in metadata
    const section = assessmentSummary.sections.find((s: any) => s.section_id === sectionId);
    if (!section) return false;
    
    // Check metadata for completion status
    const timing = assessmentSummary?.metadata?.timing?.all_sections?.[sectionId];
    if (timing?.is_completed || timing?.completed_at) {
      return true;
    }
    
    // Check if section has a completed flag
    if (section.is_completed || section.status === 'completed' || section.completed_at) {
      return true;
    }
    
    // Check if section is marked as completed in the assessment metadata
    const completedSections = assessmentSummary?.metadata?.completed_sections || [];
    if (Array.isArray(completedSections) && completedSections.includes(sectionId)) {
      return true;
    }
    
    return false;
  };

  // Get section details with question types (similar to instruction pages)
  const getSectionDetails = (section: any) => {
    // Calculate total question count
    const uniqueQuestionIds = new Set<string>();
    section?.question_types?.forEach((qt: any) => {
      if (Array.isArray(qt?.question_ids)) {
        qt.question_ids.forEach((id: string) => {
          if (id) {
            uniqueQuestionIds.add(id);
          }
        });
      }
    });

    const fallbackQuestionCount =
      section?.question_types?.reduce(
        (sum: number, qt: any) => sum + (qt.count || 0),
        0
      ) || 0;

    const questionCount =
      uniqueQuestionIds.size > 0 ? uniqueQuestionIds.size : fallbackQuestionCount;
    const durationMinutes = section?.duration_minutes || 0;
    const sectionName = section?.section_name || `Section ${section?.section_order || 1}`;

    // Get unique question type names for this section
    const uniqueQuestionTypes = new Set();
    const sectionQuestionTypes: string[] = [];

    section?.question_types?.forEach((qt: any) => {
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

    return {
      questionCount,
      durationMinutes,
      sectionName,
      questionTypes: sectionQuestionTypes,
    };
  };

  const handleSelectSection = useCallback(
    async (section: any) => {
      const sectionId = section?.section_id;
      const sectionOrder = section?.section_order || 1;
      const candidateId = storedCandidateId || candidate_id;
      
      if (!authToken) {
        notification.error({
          message: "Authentication Error",
          description:
            "No authentication token found. Please refresh the page and try again.",
          duration: 5,
        });
        return;
      }

      // Prevent multiple clicks on the same section
      if (loadingSectionId === sectionId) {
        return;
      }

      // Store the selected section ID in localStorage so Test.tsx can use it
      if (sectionId) {
        localStorage.setItem(`selected_section_id_${candidateId}`, sectionId);
        console.log("✅ Stored section_id in localStorage:", sectionId, "for candidate:", candidateId);
      }

      // Set loading state for this specific section
      setLoadingSectionId(sectionId);

      try {
        dispatch(setAssessmentStartLoading(true));
        console.log("Starting assessment for section:", sectionOrder);
        
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
            // Find the selected section by section_id from localStorage
            const storedSectionId = localStorage.getItem(`selected_section_id_${candidateId}`);
            
            let selectedSection = null;
            if (storedSectionId) {
              selectedSection = updatedSummary?.sections?.find((s: any) => s.section_id === storedSectionId);
              console.log("✅ Found section from localStorage:", storedSectionId, selectedSection);
            }
            
            // If not found by section_id, try to find by section_order
            if (!selectedSection) {
              selectedSection = updatedSummary?.sections?.find((s: any) => s.section_order === sectionOrder);
              console.log("✅ Found section by section_order:", selectedSection);
            }
            
            // Last fallback: use index based on section_order
            if (!selectedSection && updatedSummary?.sections?.length > 0) {
              const index = sectionOrder - 1;
              if (index >= 0 && index < updatedSummary.sections.length) {
                selectedSection = updatedSummary.sections[index];
                console.log("✅ Using section at index as fallback:", selectedSection);
              }
            }
            
            if (selectedSection?.section_id) {
              // Store section_id in localStorage for Test.tsx to use
              localStorage.setItem(`selected_section_id_${candidateId}`, selectedSection.section_id);
              
              // Update metadata to indicate the selected section is current
              const updatedSummaryWithSection: any = {
                ...updatedSummary,
                metadata: {
                  ...(updatedSummary as any)?.metadata,
                  current_section_id: selectedSection.section_id,
                },
              };
              dispatch(setAssessmentSummary(updatedSummaryWithSection));
              console.log("✅ Set section as current section:", selectedSection.section_id);
            } else {
              dispatch(setAssessmentSummary(updatedSummary));
              console.warn("⚠️ Could not find selected section in assessment summary");
            }
          }
        } catch (summaryError) {
          console.error("Failed to refresh assessment summary after start:", summaryError);
        }

        // Ensure the continuing flag is set so fullscreen modal doesn't show
        localStorage.setItem(`assessment_continuing_${candidateId}`, "true");

        notification.success({
          message: "Assessment Started",
          description: "Your assessment has been started successfully. You can now begin the test.",
          duration: 3,
        });
        
        // Navigate directly to test page
        setTimeout(() => {
          navigate(`/${candidateId}/test`);
        }, 100);
        
      } catch (error) {
        console.error("Error starting assessment:", error);
        dispatch(setAssessmentStartError(error));
        notification.error({
          message: "Failed to Start Assessment",
          description: "There was an error starting the assessment. Please try again.",
          duration: 5,
        });
      } finally {
        dispatch(setAssessmentStartLoading(false));
        setLoadingSectionId(null);
      }
    },
    [candidate_id, navigate, storedCandidateId, authToken, dispatch, assessmentSummary, loadingSectionId]
  );

  const sections = getSections();

  if (assessmentSummaryLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Text className="text-white text-lg">Loading sections...</Text>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Text className="text-white text-lg">No sections available</Text>
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 lg:py-16 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              {assessmentSummaryLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                "Select a Section"
              )}
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Choose which section you would like to take
            </p>
          </div>

          <Row gutter={[24, 24]} className="w-full max-w-6xl mt-4">
            {sections.map((section: any, index: number) => {
              const { questionCount, durationMinutes, sectionName, questionTypes: sectionQuestionTypes } = getSectionDetails(section);
              const completed = isSectionCompleted(section.section_id);
              const sectionOrder = section?.section_order || index + 1;

              return (
                <Col xs={24} sm={24} md={12} lg={sections.length === 1 ? 24 : 12} key={section.section_id || index}>
                  <Card
                    title={
                      <Row align="middle" justify="start" gutter={10}>
                        <Col>
                          <img
                            src={`${import.meta.env.BASE_URL}assessment/file-text.svg`}
                            alt="File text"
                          />
                        </Col>
                        <Col>{sectionName.replace(" Instructions", "")}</Col>
                      </Row>
                    }
                    extra={
                      <Tag className="!px-4 !py-1 !rounded-2xl !text-[#C4B5FD] !border !border-[#C4B5FD]">
                        Section {sectionOrder}
                      </Tag>
                    }
                    className={`!bg-[#000000] !rounded-2xl w-full ${
                      completed ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <Card className="!rounded-2xl !border-none !bg-[#1F222AA6] relative overflow-hidden">
                        {/* Bottom-left radial gradient overlay */}
                        <div className="absolute -bottom-20 left-5 w-40 h-40 bg-[#7C3AED] opacity-60 rounded-full blur-3xl z-0" />

                        {/* Content */}
                        <Row align="middle" justify="start" className="relative z-10">
                          <Col flex="none">
                            <img
                              src={`${import.meta.env.BASE_URL}assessment/clipboard-with-checklist-paper-note.png`}
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
                                    {questionCount} questions
                                  </span>{" "}
                                  and you will have{" "}
                                  <span className="text-[#E1BCFF] text-lg font-bold">
                                    {durationMinutes} minutes
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
                              src={`${import.meta.env.BASE_URL}assessment/red-alarm-clock-with-yellow-arrow.png`}
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
                          `${sectionQuestionTypes.length} Question types`
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
                          sectionQuestionTypes.map(
                            (questionType: string, typeIndex: number) => (
                              <Col key={typeIndex}>
                                <Tag className="!flex items-center gap-2 !px-3 !py-2 !rounded-[10px] !bg-[#1F222A] !border-none !text-white !text-xs">
                                  <img
                                    src={`${import.meta.env.BASE_URL}assessment/list-bullets.svg`}
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

                      {!completed && (
                        <div className="flex justify-end pt-2 sm:pt-3">
                          <Button
                            type="primary"
                            size="large"
                            loading={loadingSectionId === section.section_id}
                            disabled={loadingSectionId !== null}
                            className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] !h-10 sm:!h-12 !rounded-lg sm:!rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSection(section);
                            }}
                          >
                            {loadingSectionId === section.section_id ? "Starting..." : "Start Test"}
                          </Button>
                        </div>
                      )}

                      {completed && (
                        <div className="flex justify-end pt-2 sm:pt-3">
                          <Tag
                            icon={<CheckCircleOutlined />}
                            color="success"
                            className="!px-4 !py-2 !text-base"
                          >
                            Completed
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>

      {/* Fullscreen Warning Modal */}
      {showFullscreenWarningModal && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.98)",
          }}
        >
          <div className="bg-[#1A1128] border-2 border-red-500 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
                <Title level={3} className="!text-white !mb-2">
                  Fullscreen Mode Required
                </Title>
                <Text className="!text-white/70 block mb-4">
                  You are not supposed to exit fullscreen mode. Please return to
                  fullscreen to continue.
                </Text>
              </div>

              <div className="mb-6">
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                  <Text className="!text-white !text-2xl !font-bold">
                    {fullscreenCountdown}
                  </Text>
                  <Text className="!text-white/70 block !text-sm">
                    seconds remaining
                  </Text>
                </div>
                <Progress
                  percent={(7 - fullscreenCountdown) * (100 / 7)}
                  showInfo={false}
                  strokeColor="#ef4444"
                  trailColor="#1f2937"
                  className="!mb-4"
                />
              </div>

              <Button
                type="primary"
                size="large"
                className="!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6B52F0] !w-full"
                onClick={async () => {
                  await enterFullscreen();
                  setShowFullscreenWarningModal(false);
                }}
              >
                Return to Fullscreen Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prevent scrolling */}
      <style>{`
        body {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}

