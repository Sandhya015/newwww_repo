import { useState, useEffect } from "react";
import { Button, Card, Col, Row, Tag, Modal, Form, Select, message } from "antd";
import DOMPurify from 'dompurify';

// Components
import QuestionFilter from "../Core/QuestionFilter";

// API
import { addQuestionsToSection as addQuestionsToSectionAPI } from "../../../lib/api";

// Toast
import { showToast } from "../../../utils/toast";

export default function OtomeytLibraryQuestion({ 
    otomeytLibraryData, 
    questionTypes,
    isLoadingQuestions,
    hasMoreQuestions,
    loadMoreQuestions,
    assessmentId,
    sectionId,
    sectionData,
    onAssessmentRefresh,
    onSectionSelect,
    onToggleFavorite,
    isFavorite,
    onSelectionChange
}: {
    otomeytLibraryData: any[];
    questionTypes: any;
    isLoadingQuestions: boolean;
    hasMoreQuestions: boolean;
    loadMoreQuestions: () => void;
    assessmentId?: string;
    sectionId?: string;
    sectionData?: {
        total_section: string;
        data: {
            sections: Array<{
                section_id: string;
                section_name: string;
                question_count: string;
                questions: any[];
                total_score: string;
                section_order: string;
                question_ids: string[];
            }>;
            [key: string]: any;
        };
    };
    onAssessmentRefresh?: () => void;
    onSectionSelect?: (sectionId: string) => void;
    onToggleFavorite?: (question: any) => void;
    isFavorite?: (question: any) => boolean;
    onSelectionChange?: (count: number) => void;
}) {
    const SHOW_CORRECT_ANSWERS = false;
    const SHOW_ANSWER_FORMAT = false;
    // State for collapsible sections in question cards
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
    
    // State for selected questions
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    
    // State for section modal
    const [isSectionModalVisible, setIsSectionModalVisible] = useState(false);
    const [sectionForm] = Form.useForm();
    
    // Track selection count for Add to Section button
    const selectedCount = selectedQuestions.length;

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

    // Use otomeytLibraryData from props instead of internal state
    const otomeytQuestions = otomeytLibraryData || [];
    
    // Add to Section Button - for Question Add page
    const addToSectionButton = (
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
    );

    // Toggle function for collapsible sections
    const toggleSection = (questionId: string, section: string) => {
        const key = `${questionId}-${section}`;
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
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
        sectionData.data.sections.forEach(section => {
            if (section.question_ids && Array.isArray(section.question_ids)) {
                // Convert all IDs to strings for consistent comparison
                const stringIds = section.question_ids.map(id => String(id)).filter(id => id && id !== 'undefined' && id !== 'null');
                allQuestionIds.push(...stringIds);
            }
        });
        return allQuestionIds;
    };

    // Check if a question is already in the assessment
    const isQuestionInAssessment = (questionId: string | undefined | null) => {
        if (!questionId) return false;
        const existingIds = getAllQuestionIdsInAssessment();
        // Convert both to strings for comparison to handle type mismatches
        return existingIds.some(id => String(id) === String(questionId));
    };

    // Helper functions to get category and question type information
    const getQuestionTypeInfo = (questionTypeId: string) => {
        if (!questionTypes?.items?.[0]?.attributes?.data?.question_types) return null;

        const questionTypesData = questionTypes.items[0].attributes.data.question_types;
        return questionTypesData.find(qt => qt.id === questionTypeId);
    };

    const getCategoryInfo = (categoryId: string) => {
        if (!questionTypes?.items?.[0]?.attributes?.data?.categories) return null;

        const categoriesData = questionTypes.items[0].attributes.data.categories;
        return categoriesData.find(cat => cat.id === categoryId);
    };

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
            const selectedQuestionData = otomeytQuestions.filter(item => 
                selectedQuestions.includes(item.unique_id || `item-${otomeytQuestions.indexOf(item)}`)
            );

            // Extract unique_ids for the API
            const questionIds = selectedQuestionData.map(item => item.unique_id).filter(Boolean);

            if (questionIds.length === 0) {
                message.error('No valid question IDs found');
                return;
            }

            // Check if questions are already in section
            const existingQuestionIds = sectionData?.data?.sections
                ?.find(s => s.section_id === sectionId)
                ?.question_ids || [];
            
            const alreadyInSection = questionIds.filter(id => existingQuestionIds.includes(id));
            const newQuestions = questionIds.filter(id => !existingQuestionIds.includes(id));

            if (alreadyInSection.length > 0 && newQuestions.length === 0) {
                message.warning(`${alreadyInSection.length > 1 ? 'These questions are' : 'This question is'} already in the section`);
                return;
            }

            // Call the new API with only new questions
            const questionsToAdd = newQuestions.length > 0 ? newQuestions : questionIds;
            const response = await addQuestionsToSectionAPI(assessmentId, sectionId, questionsToAdd);

            if (response.success) {
                // Get section name for better UX
                const sectionName = sectionData?.data?.sections?.find(s => s.section_id === sectionId)?.section_name || 'section';
                
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
                    // Call refresh - getAssessmentData is async and returns a promise
                    // Use a small delay to ensure refresh completes, then select the section
                    onAssessmentRefresh();
                    // Select the section after refresh completes (getAssessmentData preserves selected section)
                    setTimeout(() => {
                        if (onSectionSelect) {
                            onSectionSelect(sectionId);
                        }
                    }, 300);
                } else {
                    // If no refresh callback, select immediately
                    if (onSectionSelect) {
                        onSectionSelect(sectionId);
                    }
                }
            } else {
                // Handle specific error cases
                if (response.status_code === 400 && response.data?.includes("All questions already exist in this assessment")) {
                    message.warning("All selected questions already exist in this assessment. Please select different questions.");
                } else {
                    message.error(`Failed to add questions: ${response.data?.message || response.data || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error('Error adding questions to section:', err);
            message.error('Failed to add questions to section');
        }
    };



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

    return (
        <>
            <style>{greenPulseStyle}</style>
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

            {/* Loading State */}
            {isLoadingQuestions && otomeytQuestions.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
                        <span className="text-lg" style={{ color: 'var(--text-primary)' }}>Loading Otomeyt questions...</span>
                    </div>
                </div>
            )}

            {/* No Questions State */}
            {!isLoadingQuestions && otomeytQuestions.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>No Otomeyt questions found</div>
                        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Questions will appear here when available</div>
                    </div>
                </div>
            )}


            {/* Questions List */}
            {otomeytQuestions.length > 0 &&
                otomeytQuestions
                    .map((item, index) => {
                        const questionId = item.unique_id || item.id || item.question_id;
                        // Only check if question is in assessment if we have a valid questionId
                        const isInAssessment = questionId ? isQuestionInAssessment(String(questionId)) : false;
                        return { item, index, isInAssessment };
                    })
                    .map(({ item, index, isInAssessment }) => (
                    <div key={item.unique_id || index} className="group !relative !w-full !rounded-[8px] !overflow-hidden !mt-5">
                    <Card
                            className={`h-auto !rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 !m-[2px] ${
                            isQuestionSelected(item.unique_id || `item-${index}`) 
                                    ? '!border-[#10B981] !border-2 selected-card' 
                                    : 'hover:!border-[#7C3AED] hover:!shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                            }`}
                        style={{
                            position: "relative",
                                borderRadius: "14px",
                            border: isQuestionSelected(item.unique_id || `item-${index}`) 
                                ? "2px solid #10B981" 
                                : "1px solid var(--border-primary)",
                            backgroundColor: isQuestionSelected(item.unique_id || `item-${index}`)
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : "var(--bg-tertiary)",
                            boxShadow: isQuestionSelected(item.unique_id || `item-${index}`)
                                ? "0px 8px 16px 0px rgba(16, 185, 129, 0.5)"
                                : "0px 4px 4px 0px rgba(0, 0, 0, 0.1)",
                                backdropFilter: "blur(25px)",
                                zIndex: 2,
                                transition: "all 0.3s ease-in-out",
                                animation: isQuestionSelected(item.unique_id || `item-${index}`) ? "pulse-green 2s ease-in-out infinite" : "none",
                            }}
                            onMouseEnter={(e) => {
                                if (!isQuestionSelected(item.unique_id || `item-${index}`)) {
                                    e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                    e.currentTarget.style.borderColor = "#7C3AED";
                                    e.currentTarget.style.boxShadow = "0px 0px 20px rgba(124, 58, 237, 0.3)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isQuestionSelected(item.unique_id || `item-${index}`)) {
                                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    e.currentTarget.style.borderColor = "var(--border-primary)";
                                    e.currentTarget.style.boxShadow = "0px 4px 4px 0px rgba(0, 0, 0, 0.1)";
                                }
                        }}
                        onClick={() => toggleQuestionSelection(item.unique_id || `item-${index}`)}
                    >
                        {/* Left border indicator */}
                        <div
                            style={{
                                position: "absolute",
                                left: "0",
                                top: "24px",
                                width: "6px",
                                height: "34px",
                                backgroundColor: isQuestionSelected(item.unique_id || `item-${index}`) ? "#10B981" : "#7C3AED",
                                borderRadius: "0px 100px 100px 0px"
                            }}
                        />

                            {/* Selection indicator */}
                        {isQuestionSelected(item.unique_id || `item-${index}`) && (
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
                                            <path
                                                d="M8 5v14l11-7z"
                                                fill="currentColor"
                                            />
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
                                                    ? (Array.isArray(item.concept) ? item.concept[0] : item.concept)
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

                                {/* Right side: Action Buttons - Show for ALL questions */}
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
                                            color: (onToggleFavorite && isFavorite && isFavorite(item)) ? "#EF4444" : "#A78BFA",
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
                                            fill={(onToggleFavorite && isFavorite && isFavorite(item)) ? "currentColor" : "none"}
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
                                                toggleSection(item.unique_id || `item-${index}`, "all_details");
                                            }}
                                >
                                    <span style={{ fontWeight: "bold" }}>{expandedSections[`${item.unique_id || `item-${index}`}-all_details`] ? "Show less" : "View more"}</span>
                                        </Button>
                            </div>
                                    </div>

                        {/* Question Details Section - Collapsible */}
                                    {expandedSections[
                                        `${item.unique_id || `item-${index}`}-all_details`
                                    ] && (
                            <Row gutter={[12, 12]} className="mt-4">
                                <Col span={24}>
                                            <div className="space-y-3">
                                        <div
                                            className="text-sm font-medium mb-3"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            Question Details:
                                        </div>
                                                {/* MCQ Options */}
                                    {item.options && item.options.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Options:
                                                        </div>

                                            <div className="space-y-2">
                                                            {item.options.map((option, idx) => (
                                                    <div
                                                        key={idx}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${option.is_correct
                                                                ? "!bg-[var(--bg-tertiary)] !border-[#10B981] !text-[#10B981]"
                                                                : "!bg-[var(--bg-tertiary)] !border-[var(--border-primary)] !text-[var(--text-primary)]"
                                                        }`}
                                                    >
                                                        <div
                                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${option.is_correct
                                                                    ? "!bg-[#10B981] !text-white"
                                                                            : "!bg-[var(--bg-tertiary)] !text-[var(--text-secondary)]"
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                                    <span
                                                                        className={`flex-1 ${option.is_correct
                                                                                ? "!text-[#10B981]"
                                                                                : "!text-[var(--text-primary)]"
                                                                            }`}
                                                                    >
                                                                        {option.text}
                                                                    </span>
                                                        {option.is_correct && (
                                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[#10B981] text-xs">✓</span>
                                                                            <span className="text-[#10B981] text-xs">
                                                                                Correct
                                                                            </span>
                                                                        </div>
                                                        )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Correct Answers */}
                                                {SHOW_CORRECT_ANSWERS && item.correct_answers && item.correct_answers.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Correct Answer{item.correct_answers.length > 1 ? "s" : ""}:
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.correct_answers.map((answer, idx) => (
                                                                <Tag
                                                                    key={idx}
                                                                    className="!px-3 !py-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: '#10B981', color: '#10B981' }}
                                                                >
                                                                    {answer}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sample Answer */}
                                                {item.sample_answer && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Sample Answer:
                                                        </div>
                                                        <div className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                                            <span style={{ color: 'var(--text-primary)' }}>{item.sample_answer}</span>
                                            </div>
                                        </div>
                                    )}

                                                {/* Expected Output */}
                                                {item.expected_output && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                                Expected Output:
                                                            </div>
                                                            <Button
                                                                type="text"
                                                                size="small"
                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSection(
                                                                        item.unique_id || `item-${index}`,
                                                                        "expected_output"
                                                                    );
                                                                }}
                                                                className="!text-[#7C3AED] !p-0 !h-auto !text-xs hover:!text-[#6D28D9]"
                                                            >
                                                                {expandedSections[
                                                                    `${item.unique_id || `item-${index}`}-expected_output`
                                                                ]
                                                                    ? "Hide Output"
                                                                    : "View Output"}
                                                            </Button>
                                                        </div>
                                                        {expandedSections[
                                                            `${item.unique_id || `item-${index}`}-expected_output`
                                                        ] && (
                                                                <div className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                                                    <span style={{ color: 'var(--text-primary)' }}>{item.expected_output}</span>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}

                                                {/* Answer Format */}
                                                {SHOW_ANSWER_FORMAT && item.answer_format && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Answer Format:
                                                        </div>
                                                        <div className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                                            <span style={{ color: 'var(--text-primary)' }}>{item.answer_format}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Scoring Guidelines */}
                                                {item.scoring_guidelines && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Scoring Guidelines:
                                                        </div>
                                                        <div className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                                            <span style={{ color: 'var(--text-primary)' }}>
                                                                {item.scoring_guidelines}
                                                            </span>
                                                        </div>
                    </div>
                                                )}

                                                {/* Test Cases */}
                                                {item.test_cases && item.test_cases.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Test Cases:
                                                        </div>
                                                        <div className="space-y-2">
                                                            {item.test_cases.map((testCase, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                                                                >
                                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                                        {JSON.stringify(testCase, null, 2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Expected Keywords */}
                                                {item.expected_keywords &&
                                                    item.expected_keywords.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                                Expected Keywords:
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.expected_keywords.map((keyword, idx) => (
                                                                    <Tag
                                                                        key={idx}
                                                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                                                    >
                                                                        {keyword}
                                                                    </Tag>
                                                                ))}
                                                            </div>
                                            </div>
                                        )}
                                </div>
                                            </Col>
                                        </Row>
                        )}
                    </Card>
                    </div>
            ))}

            {/* Load More Button */}
            {hasMoreQuestions && otomeytQuestions.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Button 
                        onClick={loadMoreQuestions}
                        disabled={isLoadingQuestions}
                        loading={isLoadingQuestions}
                        style={{
                            backgroundColor: "#5B21B6",
                            borderColor: "#5B21B6",
                            color: "var(--text-primary)"
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoadingQuestions) {
                                e.currentTarget.style.backgroundColor = "#4C1D95";
                                e.currentTarget.style.borderColor = "#4C1D95";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoadingQuestions) {
                                e.currentTarget.style.backgroundColor = "#5B21B6";
                                e.currentTarget.style.borderColor = "#5B21B6";
                            }
                        }}
                    >
                        {isLoadingQuestions ? 'Loading...' : 'Load More Questions'}
                    </Button>
                </div>
            )}

            {/* Section Selection Modal */}
            <Modal
                title={
                    <div style={{
                        fontFamily: "Helvetica_Neue-Medium, Helvetica",
                        fontWeight: "500",
                        fontSize: "18px",
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
                className="section-selection-modal"
                style={{
                    background: 'linear-gradient(158deg, #121215 4.17%, #09090B 94.14%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <div className="mb-4">
                    <p className="text-[#D2D2D3] text-sm mb-4">
                        Select a section to add {selectedQuestions.length} selected question{selectedQuestions.length > 1 ? 's' : ''} to:
                    </p>
                    
                    {!sectionData?.data?.sections || sectionData.data.sections.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No sections available</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Please create a section first before adding questions.</p>
                        </div>
                    ) : (
                        <Form
                            form={sectionForm}
                            layout="vertical"
                            onFinish={(values) => {
                                if (values.section_id) {
                                    addQuestionsToSection(values.section_id);
                                }
                            }}
                        >
                            <Form.Item
                                name="section_id"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Select Section
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a section!' }]}
                            >
                                <Select
                                    placeholder="Choose a section"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                                    options={
                                        sectionData.data.sections.map(section => ({
                                            label: section.section_name || `Section ${section.section_id}`,
                                            value: section.section_id
                                        }))
                                    }
                                />
                            </Form.Item>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button 
                                    onClick={() => {
                                        setIsSectionModalVisible(false);
                                        sectionForm.resetFields();
                                    }}
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: 'var(--border-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{
                                        backgroundColor: "#5B21B6",
                                        borderColor: "#5B21B6",
                                        color: "#ffffff"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#4C1D95";
                                        e.currentTarget.style.borderColor = "#4C1D95";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#5B21B6";
                                        e.currentTarget.style.borderColor = "#5B21B6";
                                    }}
                                >
                                    Add to Section
                                </Button>
                            </div>
                        </Form>
                    )}
                </div>
            </Modal>
        </>
    )
}
