/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from "react-router-dom";
import { Card, Col, Row, Tag, Typography, notification } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useSecureMode } from "../../hooks/useSecureMode";
import { fetchAssessmentSummary, startAssessment } from "../../services/questionTypesApi";
import {
  setAssessmentStarted,
  setAssessmentStartLoading,
  setAssessmentStartError,
  setAssessmentSummary,
} from "../../store/miscSlice";
import { useEffect } from "react";

const { Title } = Typography;

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
    const key = section.section_id || section.section_name || `section-${sectionMap.size}`;
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

export default function Section2Instruction() {
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

  // Helper functions to get section-specific data
  const getSection2Data = () => {
    if (
      !assessmentSummary?.sections ||
      !Array.isArray(assessmentSummary.sections)
    ) {
      return {
        questionCount: 0,
        duration: 0,
        questionTypes: [],
        sectionName: "Section 2 Instructions",
      };
    }

    const section2 = assessmentSummary.sections[1]; // Second section
    if (!section2) {
      return {
        questionCount: 0,
        duration: 0,
        questionTypes: [],
        sectionName: "Section 2 Instructions",
      };
    }

    // Calculate total question count - sum all counts from question_types
    const uniqueQuestionIds = new Set<string>();

    section2.question_types?.forEach((qt: any) => {
      if (Array.isArray(qt?.question_ids)) {
        qt.question_ids.forEach((id: string) => {
          if (id) {
            uniqueQuestionIds.add(id);
          }
        });
      }
    });

    const fallbackQuestionCount =
      section2.question_types?.reduce(
        (sum: number, qt: any) => sum + (qt.count || 0),
        0
      ) || 0;

    const questionCount =
      uniqueQuestionIds.size > 0 ? uniqueQuestionIds.size : fallbackQuestionCount;
    const duration = section2.duration_minutes || 0;
    const sectionName = section2.section_name || "Section 2 Instructions";

    // Get unique question type names for this section
    const uniqueQuestionTypes = new Set();
    const sectionQuestionTypes: string[] = [];

    section2.question_types?.forEach((qt: any) => {
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

    console.log("Section 2 Data:", {
      section2,
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
            console.log('Starting assessment...');
            
            const response = await startAssessment(authToken);
            console.log('Assessment started successfully:', response);
            
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
                    
                    // Find Section 2 by section_id from localStorage, or fallback to index 1
                    let section2 = null;
                    if (storedSectionId) {
                        section2 = updatedSummary?.sections?.find((s: any) => s.section_id === storedSectionId);
                        console.log("✅ Found section from localStorage:", storedSectionId, section2);
                    }
                    
                    // If not found by section_id, try to find by section_order = 2
                    if (!section2) {
                        section2 = updatedSummary?.sections?.find((s: any) => s.section_order === 2);
                        console.log("✅ Found section by section_order:", section2);
                    }
                    
                    // Last fallback: use index 1
                    if (!section2 && updatedSummary?.sections?.length > 1) {
                        section2 = updatedSummary.sections[1];
                        console.log("✅ Using section at index 1 as fallback:", section2);
                    }
                    
                    if (section2?.section_id) {
                        // Store section_id in localStorage for Test.tsx to use
                        localStorage.setItem(`selected_section_id_${candidateId}`, section2.section_id);
                        
                        // Update metadata to indicate Section 2 is current
                        const updatedSummaryWithSection2: any = {
                            ...updatedSummary,
                            metadata: {
                                ...(updatedSummary as any)?.metadata,
                                current_section_id: section2.section_id,
                            },
                        };
                        dispatch(setAssessmentSummary(updatedSummaryWithSection2));
                        console.log("✅ Set Section 2 as current section:", section2.section_id);
                    } else {
                        dispatch(setAssessmentSummary(updatedSummary));
                        console.warn("⚠️ Could not find Section 2 in assessment summary");
                    }
                }
            } catch (summaryError) {
                console.error('Failed to refresh assessment summary after start:', summaryError);
            }

            // Ensure the continuing flag is set so fullscreen modal doesn't show
            localStorage.setItem(`assessment_continuing_${storedCandidateId || candidate_id}`, "true");

            notification.success({
                message: 'Assessment Started',
                description: 'Your assessment has been started successfully. You can now begin the test.',
                duration: 3
            });
            
            // Navigate to test page with a small delay to ensure state is updated
            setTimeout(() => {
                navigate(`/${storedCandidateId || candidate_id}/test`);
            }, 100);
            
        } catch (error) {
            console.error('Error starting assessment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to start assessment';
            
            dispatch(setAssessmentStartError(errorMessage));
            
            notification.error({
                message: 'Failed to Start Assessment',
                description: errorMessage,
                duration: 5
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

    return (
        <div className="flex justify-center items-start relative bg-black text-white py-4 sm:py-6 px-4 h-screen overflow-hidden">
            {/* Background Video */}
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
                <source src={`${import.meta.env.BASE_URL}common/getty-images.mp4`} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            
            <div className="absolute top-4 left-4 md:top-6 md:left-8 z-10">
                <img src={`${import.meta.env.BASE_URL}assessment/logo.svg`} alt="Logo" className="h-8 md:h-10" />
            </div>

      <div className="absolute inset-0 overflow-hidden">
        {/* Top-left Glow */}
        <div className="absolute w-80 h-80 -top-32 -left-32 bg-[#4f43b7] rounded-full blur-[172px] opacity-60" />

        {/* Bottom-right Glow */}
        <div className="absolute w-80 h-80 -bottom-32 -right-32 bg-[#4f43b7] rounded-full blur-[172px] opacity-60" />
      </div>

            <div className="flex-col grid gap-4 items-center justify-center mt-16 md:mt-20 mb-6">
                 <div className="flex-col grid gap-2 items-center justify-center">
                     <Col className="flex justify-center !text-2xl font-semibold">
                         {(assessmentSummaryLoading || questionTypesLoading) ? (
                             <span className="animate-pulse">Loading...</span>
                         ) : (
                             getSection2Data().sectionName
                         )}
                     </Col>
                     <Col>Pay attention to section details and timing. Follow instructions for a fair test.</Col>
                 </div>

                <Card title={
                    <Row align="middle" justify="start" gutter={10}>
                        <Col>
                            <img src={`${import.meta.env.BASE_URL}assessment/file-text.svg`} />
                        </Col>
                        <Col>
                            {assessmentSummaryLoading || questionTypesLoading ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                getSection2Data().sectionName.replace(" Instructions", "")
                            )}
                        </Col>
                    </Row>
                } extra={<Tag className="!px-4 !py-1 !rounded-2xl !text-[#C4B5FD] !border !border-[#C4B5FD]">Section 2</Tag>} className="!bg-[#000000] !rounded-2xl">
                    <div className="grid gap-3">
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
                          {getSection2Data().questionCount} questions
                        </span>{" "}
                        and you will have{" "}
                        <span className="text-[#E1BCFF] text-lg font-bold">
                          {getSection2Data().duration} minutes
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

            <span className="font-semibold">
              {assessmentSummaryLoading || questionTypesLoading ? (
                <span className="animate-pulse">Loading question types...</span>
              ) : (
                `${getSection2Data().questionTypes.length} Question types`
              )}
            </span>

            <Row align="middle" justify="start" gutter={[5, 5]}>
              {assessmentSummaryLoading || questionTypesLoading ? (
                <Col>
                  <span className="animate-pulse text-gray-400">
                    Loading...
                  </span>
                </Col>
              ) : (
                getSection2Data().questionTypes.map(
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

                <div className="flex flex-col sm:flex-row justify-end pt-2 sm:pt-3 gap-2 sm:gap-3 z-10">
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
  );
}
