/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, Tag, Button, Row, Col, Empty, Modal, Form, Select, message, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { addQuestionsToSection as addQuestionsToSectionAPI } from "../../../lib/api";
import { showToast } from "../../../utils/toast";
import QuestionFilter from "../Core/QuestionFilter";

// Add CSS animation for green pulse effect
const greenPulseStyle = `
  @keyframes pulse-green {
    0%, 100% {
      box-shadow: 0px 8px 16px 0px rgba(16, 185, 129, 0.5);
      background: linear-gradient(158deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%);
    }
    50% {
      box-shadow: 0px 8px 24px 0px rgba(16, 185, 129, 0.7);
      background: linear-gradient(158deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.4) 100%);
    }
  }
`;

export default function FavouriteQuestion({
  favoriteQuestions,
  questionTypes,
  assessmentId,
  sectionId,
  sectionData,
  onAssessmentRefresh,
  onSectionSelect,
  onToggleFavorite,
  isFavorite,
  onSelectionChange,
}: {
  favoriteQuestions: any[];
  questionTypes: any;
  assessmentId?: string;
  sectionId?: string;
  sectionData?: any;
  onAssessmentRefresh?: () => void;
  onSectionSelect?: (sectionId: string) => void;
  onToggleFavorite?: (question: any) => void;
  isFavorite?: (question: any) => boolean;
  onSelectionChange?: (count: number) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  
  // State for selected questions
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // State for section modal
  const [isSectionModalVisible, setIsSectionModalVisible] = useState(false);
  const [sectionForm] = Form.useForm();
  
  // Track selection count
  const selectedCount = selectedQuestions.length;

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Filter favorite questions based on search term
  const filteredFavoriteQuestions = favoriteQuestions.filter((item) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const title = (item.title || item.question_text || "").toLowerCase();
    const description = (item.description || item.question || "").toLowerCase();
    const domain = (item.domain || "").toLowerCase();
    const concept = Array.isArray(item.concept) 
      ? item.concept.join(" ").toLowerCase()
      : (item.concept || "").toLowerCase();
    
    return (
      title.includes(searchLower) ||
      description.includes(searchLower) ||
      domain.includes(searchLower) ||
      concept.includes(searchLower)
    );
  });

  const toggleSection = (questionId: string, section: string) => {
    const key = `${questionId}-${section}`;
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle question selection
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSelection = prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId];
      // Notify parent of selection count change
      if (onSelectionChange) {
        onSelectionChange(newSelection.length);
      }
      return newSelection;
    });
  };

  // Check if a question is selected
  const isQuestionSelected = (questionId: string) => {
    return selectedQuestions.includes(questionId);
  };

  // Get all question IDs already in the assessment (across all sections)
  const getAllQuestionIdsInAssessment = () => {
    if (!sectionData?.data?.sections) return [];
    
    const allQuestionIds: string[] = [];
    sectionData.data.sections.forEach((section: any) => {
      if (section.question_ids && Array.isArray(section.question_ids)) {
        allQuestionIds.push(...section.question_ids);
      }
    });
    return allQuestionIds;
  };

  // Check if a question is already in the assessment
  const isQuestionInAssessment = (questionId: string) => {
    const existingIds = getAllQuestionIdsInAssessment();
    return existingIds.includes(questionId);
  };

  // Listen for custom event to open modal from sidebar
  useEffect(() => {
    const handleOpenModal = () => {
      if (selectedQuestions.length > 0) {
        setIsSectionModalVisible(true);
      }
    };
    window.addEventListener('openAddToSectionModal', handleOpenModal);
    return () => {
      window.removeEventListener('openAddToSectionModal', handleOpenModal);
    };
  }, [selectedQuestions.length]);

  // Function to add selected questions to a section
  const addQuestionsToSection = async (sectionId: string) => {
    try {
      if (!assessmentId || !sectionId) {
        message.error('Assessment ID and Section ID are required');
        return;
      }

      if (selectedQuestions.length === 0) {
        message.error('No questions selected');
        return;
      }

      // Get the selected question unique_ids
      const selectedQuestionData = favoriteQuestions.filter(item => 
        selectedQuestions.includes(item.unique_id || item.id)
      );
      
      const questionIds = selectedQuestionData
        .map(item => item.unique_id || item.id)
        .filter(id => id !== undefined && id !== null) as string[];

      if (questionIds.length === 0) {
        message.error('No valid question IDs found');
        return;
      }

      // Check if questions are already in section
      const existingQuestionIds = sectionData?.data?.sections
        ?.find((s: any) => s.section_id === sectionId)
        ?.question_ids || [];
      
      const alreadyInSection = questionIds.filter(id => existingQuestionIds.includes(id));
      const newQuestions = questionIds.filter(id => !existingQuestionIds.includes(id));

      if (alreadyInSection.length > 0 && newQuestions.length === 0) {
        message.warning(`This question is already there in the section, select other question`);
        return;
      }

      if (alreadyInSection.length > 0 && newQuestions.length > 0) {
        message.warning(`${alreadyInSection.length} question${alreadyInSection.length > 1 ? 's are' : ' is'} already in the section. Adding ${newQuestions.length} new question${newQuestions.length > 1 ? 's' : ''}.`);
      }

      // Call the new API with only new questions
      const questionsToAdd = newQuestions.length > 0 ? newQuestions : questionIds;
      const response = await addQuestionsToSectionAPI(assessmentId, sectionId, questionsToAdd);

      if (response.success) {
        // Get section name for better UX
        const sectionName = sectionData?.data?.sections?.find((s: any) => s.section_id === sectionId)?.section_name || 'section';
        
        // Show success toast
        showToast({
          message: "Questions Added to Section",
          description: `Successfully added ${questionsToAdd.length} question${questionsToAdd.length > 1 ? 's' : ''} to ${sectionName}!`,
          position: "top-right",
          duration: 4000,
          type: "success"
        });
        
        // Clear selections
        setSelectedQuestions([]);
        if (onSelectionChange) {
          onSelectionChange(0);
        }
        // Close modal
        setIsSectionModalVisible(false);
        // Trigger assessment refresh to update section data, then select the section
        if (onAssessmentRefresh) {
          onAssessmentRefresh();
          setTimeout(() => {
            if (onSectionSelect) {
              onSectionSelect(sectionId);
            }
          }, 300);
        } else {
          if (onSectionSelect) {
            onSectionSelect(sectionId);
          }
        }
      } else {
        // Handle specific error cases
        if (response.status_code === 400 && response.data?.includes("All questions already exist in this assessment")) {
          message.warning("This question is already there in the section, select other question");
        } else {
          message.error(`Failed to add questions: ${response.data?.message || response.data || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error adding questions to section:', err);
      message.error('Failed to add questions to section');
    }
  };

  // Helper functions to get category and question type information
  const getQuestionTypeInfo = (questionTypeId: string) => {
    if (!questionTypes?.items?.[0]?.attributes?.data?.question_types) return null;
    const questionTypesData = questionTypes.items[0].attributes.data.question_types;
    return questionTypesData.find((qt: any) => qt.id === questionTypeId);
  };

  const getCategoryInfo = (categoryId: string) => {
    if (!questionTypes?.items?.[0]?.attributes?.data?.categories) return null;
    const categoriesData = questionTypes.items[0].attributes.data.categories;
    return categoriesData.find((cat: any) => cat.id === categoryId);
  };

  // Show all questions (including those already in assessment) and apply search filter
  const displayQuestions = filteredFavoriteQuestions.map(item => {
    const questionId = item.unique_id || item.id;
    const isInAssessment = isQuestionInAssessment(questionId);
    return { ...item, isInAssessment };
  });

  if (favoriteQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Empty
          description={
            <span style={{ color: "var(--text-secondary)" }}>
              No favorite questions yet. Click the heart icon on any question to add it to favorites.
            </span>
          }
        />
      </div>
    );
  }

  // Add to Section Button - for Question Add page
  const addToSectionButton = assessmentId ? (
    <Button
      type="primary"
      size="small"
      onClick={() => {
        if (selectedQuestions.length > 0) {
          setIsSectionModalVisible(true);
        }
      }}
      disabled={selectedCount === 0}
      className="!bg-[#5B21B6] !border-[#5B21B6] hover:!bg-[#4C1D95] hover:!border-[#4C1D95] disabled:!opacity-50 disabled:!cursor-not-allowed"
      style={{
        height: "32px",
        whiteSpace: "nowrap",
        fontFamily: "Helvetica_Neue-Medium, Helvetica",
        fontWeight: "500",
        fontSize: "14px",
        minWidth: "140px",
      }}
    >
      {selectedCount > 0 ? `Add to Section (${selectedCount})` : 'Add to Section'}
    </Button>
  ) : null;

  return (
    <>
    <style>{greenPulseStyle}</style>
    {/* QuestionFilter - Only show in Question Add page (when assessmentId is present) */}
    {assessmentId && (
      <QuestionFilter 
        createButton={undefined}
        onFilterChange={() => {}}
        clearAllFilters={() => {}}
        skill={undefined}
        domain={undefined}
        difficultyLevel={undefined}
        categoryId={undefined}
        questionTypeId={undefined}
        status={undefined}
        tags={undefined}
        concept={undefined}
        showBulkUpload={false}
        questionTypes={questionTypes}
        addToSectionButton={addToSectionButton}
        selectedCount={selectedCount}
        onClearSelection={() => {
          setSelectedQuestions([]);
          if (onSelectionChange) {
            onSelectionChange(0);
          }
        }}
      />
    )}
    
    {/* Search Input - Removed from Question Library page as per user request */}

    {displayQuestions.length === 0 && searchTerm ? (
      <div className="flex items-center justify-center py-12">
        <Empty
          description={
            <span style={{ color: "var(--text-secondary)" }}>
              No questions found matching "{searchTerm}"
            </span>
          }
        />
      </div>
    ) : (
    <div className="space-y-5" style={{ marginTop: assessmentId ? '24px' : '0' }}>
      {displayQuestions.map((item, index) => {
          const questionId = item.unique_id || item.id || `item-${index}`;
          const isSelected = isQuestionSelected(questionId);
          const isInAssessment = item.isInAssessment;
          return (
        <div key={questionId} className="group !relative !w-full !rounded-[8px] !overflow-hidden">
          <Card
            className={`h-auto !rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 !m-[2px] ${
              isSelected 
                ? '!border-[#10B981] !border-2 selected-card' 
                : isInAssessment
                ? '!border-[var(--accent-primary)] !border-2'
                : 'hover:!border-[#7C3AED] hover:!shadow-[0_0_20px_rgba(124,58,237,0.3)]'
            }`}
            style={{
              position: "relative",
              borderRadius: "14px",
              border: isSelected 
                ? "2px solid #10B981" 
                : isInAssessment
                ? "2px solid var(--accent-primary)"
                : "1px solid var(--border-primary)",
              backgroundColor: isSelected
                ? "rgba(16, 185, 129, 0.1)"
                : "var(--bg-tertiary)",
              boxShadow: isSelected
                ? "0px 8px 16px 0px rgba(16, 185, 129, 0.5)"
                : "0px 4px 4px 0px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(25px)",
              zIndex: 2,
              transition: "all 0.3s ease-in-out",
              animation: isSelected ? "pulse-green 2s ease-in-out infinite" : "none",
            }}
            onMouseEnter={(e) => {
              // Only apply hover effects if this specific card is not selected and not in assessment
              if (!isSelected && !isInAssessment) {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "#7C3AED";
                e.currentTarget.style.boxShadow = "0px 0px 20px rgba(124, 58, 237, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              // Only reset hover effects if this specific card is not selected and not in assessment
              if (!isSelected && !isInAssessment) {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.boxShadow = "0px 4px 4px 0px rgba(0, 0, 0, 0.1)";
              }
            }}
            onClick={() => toggleQuestionSelection(questionId)}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  width: "24px",
                  height: "24px",
                  backgroundColor: "#10B981",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  boxShadow: "0px 2px 8px rgba(16, 185, 129, 0.4)"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                </svg>
              </div>
            )}
            {/* Left border indicator */}
            <div
              style={{
                position: "absolute",
                left: "0",
                top: "24px",
                width: "6px",
                height: "34px",
                backgroundColor: isSelected ? "#10B981" : "#7C3AED",
                borderRadius: "0px 100px 100px 0px",
              }}
            />

            <div style={{ padding: "20px" }}>
              {/* Title */}
              <div
                style={{
                  fontFamily: "Helvetica_Neue-Medium, Helvetica",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  fontSize: "16px",
                  lineHeight: "1.4",
                  marginBottom: "16px",
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    item.title || item.question_text || "Untitled Question"
                  ),
                }}
              />

              {/* Header Row - All elements in one horizontal row */}
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                {/* Left side: Tech Tag + Metadata */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Technology Tag */}
                  <Tag
                    className="!text-xs !px-3 !py-1 !rounded-full !border-0"
                    style={{
                      backgroundColor: "rgba(124, 58, 237, 0.15)",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                      color: "#C4B5FD",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                    {getQuestionTypeInfo(item.question_type_id)?.label ||
                      getCategoryInfo(item.category_id)?.label ||
                      item.tag ||
                      "React"}
                  </Tag>

                  {/* Metadata Group */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={`${import.meta.env.BASE_URL}question-library/calendar-dots.svg`}
                        className="w-4 h-4"
                        alt="calendar"
                      />
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                        }}
                      >
                        Created at{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              }
                            )
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={`${import.meta.env.BASE_URL}question-library/tag.svg`}
                        className="w-4 h-4"
                        alt="domain"
                      />
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                        }}
                      >
                        {item.domain || "General"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={`${import.meta.env.BASE_URL}question-library/light-bulb.svg`}
                        className="w-4 h-4"
                        alt="concept"
                      />
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                        }}
                      >
                        {item.concept && item.concept.length > 0
                          ? Array.isArray(item.concept)
                            ? item.concept[0]
                            : item.concept
                          : "General"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={`${import.meta.env.BASE_URL}question-library/escalator-down.svg`}
                        className="w-4 h-4"
                        alt="difficulty"
                      />
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                        }}
                      >
                        L{item.difficulty_level || "?"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={`${import.meta.env.BASE_URL}question-library/clock.svg`}
                        className="w-4 h-4"
                        alt="time"
                      />
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                        }}
                      >
                        {item.time_limit || item.duration || item.estimated_time || "2"} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    type="text"
                    className="!px-3 !py-1 !h-auto !bg-[#E9CFFF0D] hover:!bg-[#E9CFFF1A] !rounded-full !border-0"
                    style={{
                      color: "#A78BFA",
                      fontSize: "12px",
                      fontFamily: "Helvetica_Neue-Regular, Helvetica",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle show similar
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}question-add/circle-half.svg`}
                      className="w-4 h-4"
                      alt="show similar"
                    />
                    Show Similar
                  </Button>
                  <Button
                    type="text"
                    className="!p-2 !h-auto !w-auto hover:!opacity-80"
                    style={{
                      color: isFavorite && isFavorite(item) ? "#EF4444" : "#A78BFA",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) {
                        onToggleFavorite(item);
                      }
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={isFavorite && isFavorite(item) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="mb-4">
                <p
                  style={{
                    fontFamily: "Helvetica_Neue-Regular, Helvetica",
                    fontWeight: "400",
                    color: "#BFBFBF",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      item.description ||
                        item.question ||
                        item.question_text ||
                        "No description available"
                    ),
                  }}
                />
              </div>

              {/* More Details Link */}
              <div>
                <Button
                  type="text"
                  className="!p-0 !h-auto !text-[#C4B5FD] hover:!text-[#A78BFA]"
                  style={{
                    fontSize: "14px",
                    fontFamily: "Helvetica_Neue-Regular, Helvetica",
                    fontWeight: "400",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(item.unique_id || item.id || `item-${index}`, "all_details");
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{expandedSections[`${item.unique_id || item.id || `item-${index}`}-all_details`] ? "Show less" : "View more"}</span>
                </Button>
              </div>
            </div>

            {/* Question Details Section - Collapsible */}
            {expandedSections[
              `${item.unique_id || item.id || `item-${index}`}-all_details`
            ] && (
              <div style={{ padding: "0 20px 20px 20px" }}>
                <div className="space-y-3">
                  <div
                    className="text-sm font-medium mb-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Question Details:
                  </div>
                  {/* Add more details here if needed */}
                </div>
              </div>
            )}
          </Card>
        </div>
      );
      })}
    </div>
    )}

    {/* Add to Section Modal */}
    <Modal
      title={
        <div style={{ 
          fontFamily: "Helvetica_Neue-Medium, Helvetica",
          fontWeight: "500",
          fontSize: "20px",
          color: "var(--text-primary)"
        }}>
          Add Questions to Section
        </div>
      }
      open={isSectionModalVisible}
      onCancel={() => {
        setIsSectionModalVisible(false);
        sectionForm.resetFields();
      }}
      footer={null}
      width={500}
      centered
      className="custom-modal"
      styles={{
        content: {
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-primary)',
          padding: '20px'
        }
      }}
    >
      <Form
        form={sectionForm}
        layout="vertical"
        onFinish={(values) => {
          if (values.sectionId) {
            addQuestionsToSection(values.sectionId);
          }
        }}
      >
        <Form.Item
          name="sectionId"
          label={
            <span style={{ 
              fontFamily: "Helvetica_Neue-Regular, Helvetica",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}>
              Select Section
            </span>
          }
          rules={[{ required: true, message: 'Please select a section' }]}
        >
          <Select
            placeholder="Choose a section"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            dropdownStyle={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {sectionData?.data?.sections?.map((section: any) => (
              <Select.Option key={section.section_id} value={section.section_id}>
                {section.section_name} ({section.question_count || 0} questions)
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => {
                setIsSectionModalVisible(false);
                sectionForm.resetFields();
              }}
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                backgroundColor: '#7C3AED',
                borderColor: '#7C3AED',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#6D28D9";
                e.currentTarget.style.borderColor = "#6D28D9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#7C3AED";
                e.currentTarget.style.borderColor = "#7C3AED";
              }}
            >
              Add Questions
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
}

