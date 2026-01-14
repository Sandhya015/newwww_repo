/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Col, Row, Tag, Button, Modal, Form, Input, Radio, Select, message } from "antd";
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';

// Components
import QuestionFilter from "../Core/QuestionFilter";
import QuestionCreationModal from "../QuestionAdd/QuestionCreationModal";

// API
import { createQuestions, addQuestionsToSection as addQuestionsToSectionAPI } from "../../../lib/api";

// Toast
import { showToast } from "../../../utils/toast";



// Custom styles for TipTap
const tiptapStyles = `
  .tiptap {
    color: var(--text-primary) !important;
    min-height: 120px;
    max-height: 180px;
    padding: 8px;
    outline: none;
    overflow-y: auto;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
  .tiptap p {
    margin: 0.3em 0;
    color: var(--text-primary) !important;
  }
  .tiptap h1, .tiptap h2, .tiptap h3 {
    color: var(--text-primary) !important;
    margin: 0.3em 0;
  }
  .tiptap ul, .tiptap ol {
    padding-left: 1.5em;
    margin: 0.3em 0;
  }
  .tiptap li {
    color: var(--text-primary) !important;
  }
  .tiptap blockquote {
    border-left: 3px solid #7C3AED;
    margin: 0.3em 0;
    padding-left: 1em;
    color: var(--text-secondary);
  }
  .tiptap code {
    background: var(--bg-tertiary);
    padding: 2px 4px;
    border-radius: 4px;
    color: #F9A216;
  }
  .tiptap pre {
    background: var(--bg-secondary);
    padding: 0.5em;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.3em 0;
  }
  .tiptap:focus {
    outline: none;
  }
`;

export default function MyLibraryQuestion({
    myLibraryData,
    isLoadingQuestions,
    hasMoreQuestions,
    loadMoreQuestions,
    questionTypes,
    assessmentId,
    sectionId,
    sectionData,
    onAssessmentRefresh,
    onRefreshLibrary,
    onSectionSelect,
    onToggleFavorite,
    isFavorite,
    onSelectionChange
}: {
    myLibraryData: any[];
    isLoadingQuestions: boolean;
    hasMoreQuestions: boolean;
    loadMoreQuestions: () => void;
    questionTypes: any;
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
    onRefreshLibrary?: () => void;
    onSectionSelect?: (sectionId: string) => void;
    onToggleFavorite?: (question: any) => void;
    isFavorite?: (question: any) => boolean;
    onSelectionChange?: (count: number) => void;
}) {
    const SHOW_CORRECT_ANSWERS = false;
    const SHOW_ANSWER_FORMAT = false;
    const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isSectionModalVisible, setIsSectionModalVisible] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [form] = Form.useForm();
    const [sectionForm] = Form.useForm();
    // State for collapsible sections in question cards
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

    // State for selected questions
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    
    // Track selection count for Add to Section button
    const selectedCount = selectedQuestions.length;

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
    }, [selectedQuestions.length, setIsSectionModalVisible]);

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
            const selectedQuestionData = myLibraryData.filter(item => 
                selectedQuestions.includes(item.unique_id || `item-${myLibraryData.indexOf(item)}`)
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

    // TipTap editor instance
    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: {
                class: 'tiptap',
            },
        },
        onUpdate: ({ editor }) => {
            // Sync editor content with form field and local state
            const html = editor.getHTML();
            form.setFieldValue('problemStatement', html);
            setEditorContent(html);
        },
    });

    // Sample concepts data - you can replace this with your actual data
    const conceptOptions = [
        { label: "JavaScript", value: "javascript", category: "Programming Languages" },
        { label: "React", value: "react", category: "Frontend Frameworks" },
        { label: "Node.js", value: "nodejs", category: "Backend Technologies" },
        { label: "Python", value: "python", category: "Programming Languages" },
        { label: "Django", value: "django", category: "Backend Frameworks" },
        { label: "SQL", value: "sql", category: "Databases" },
        { label: "MongoDB", value: "mongodb", category: "Databases" },
        { label: "AWS", value: "aws", category: "Cloud Services" },
        { label: "Docker", value: "docker", category: "DevOps" },
        { label: "Git", value: "git", category: "Version Control" },
    ];


    // Initialize form field when modal opens
    useEffect(() => {
        if (isModalVisible) {
            form.setFieldValue('problemStatement', '');
            setEditorContent('');
        }
    }, [isModalVisible, form]);

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        if (editor) {
            editor.commands.setContent('');
        }
        // Also clear the problem statement field and state
        form.setFieldValue('problemStatement', '');
        setEditorContent('');
        // Clear selected file
        setSelectedFile(null);
        const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (values) => {
        try {
            // Get the selected correct answer
            const correctAnswer = values.correct_answer;

            // Build options array with correct format
            const options = ['A', 'B', 'C', 'D'].map(option => ({
                text: values[`option_${option.toLowerCase()}_text`] || `Option ${option}`,
                is_correct: option === correctAnswer
            }));

            // Get correct answers array
            const correctAnswers = options
                .filter(option => option.is_correct)
                .map(option => option.text);

            // Parse test cases if provided
            let testCases = [];
            if (values.test_cases) {
                try {
                    testCases = JSON.parse(values.test_cases);
                } catch {
                    console.warn('Invalid test cases JSON format');
                }
            }

            // Get the selected question type and category from form values
            const selectedQuestionTypeId = values.question_type_id;
            const selectedCategoryId = values.category_id;

            if (!selectedQuestionTypeId || !selectedCategoryId) {
                throw new Error('Please select both question type and category');
            }

            // Prepare the question data according to the API specification
            const questionData = {
                question_type_id: selectedQuestionTypeId,
                category_id: selectedCategoryId,
                question_text: values.question_text,
                domain: values.domain,
                skill: values.skill,
                difficulty_level: values.difficulty_level,
                description: values.problemStatement || '',
                hints: values.hints || [],
                options: options,
                correct_answers: correctAnswers,
                languages: values.languages || [],
                tags: values.tags || [],
                concept: values.concept || [],
                question_assets: {},
                answer_format: values.answer_format,
                expected_output: values.expected_output,
                test_cases: testCases,
                max_score: values.max_score || 1,
                time_limit: values.time_limit || 5,
                shuffle_options: false,
                ai_evaluation_enabled: false,
                expected_keywords: values.expected_keywords || [],
                translations: {},
                media_alternatives: {},
                reading_level: values.reading_level,
                version: 1,
                parent_question_id: "",
                is_template: false,
                evaluation_criteria: [],
                scoring_guidelines: values.scoring_guidelines,
                sample_answer: values.sample_answer,
                question_type_details: {},
                ai_insights: {},
                company_id: "", // You'll need to get this from context/store
                organization_id: "", // You'll need to get this from context/store
                library_scope: "meritedge"
            };

            // API call
            if (!assessmentId || !sectionId) {
                throw new Error('Assessment ID and Section ID are required');
            }

            const response = await createQuestions(assessmentId, sectionId, {
                questions: [questionData],
                add_to_library: true
            });

            if (!response.success) {
                throw new Error(`API error: ${response.data?.message || 'Failed to create question'}`);
            }

            // Show success message
            // You can use your toast notification system here
            // showToast({ message: "Success", description: "Question created successfully!" });

            // Close modal and reset form
            setIsModalVisible(false);
            form.resetFields();
            if (editor) {
                editor.commands.setContent('');
            }
            form.setFieldValue('problemStatement', '');
            setEditorContent('');

        } catch (err) {
            console.error('Error creating question:', err);
            // Show error message
            // showToast({ message: "Error", description: "Failed to create question. Please try again." });
        }
    };

    // Function to download sample CSV file
    const downloadSampleCSV = () => {
        const csvContent = `question_text,domain,skill,concept,difficulty_level,max_score,option_a_text,option_b_text,option_c_text,option_d_text,correct_answer,problem_statement,tags
"What is the capital of France?","Geography","World Knowledge","Geography",2,1,"Paris","London","Berlin","Madrid","A","Paris is the capital and largest city of France.","geography,capitals,europe
"What is 2 + 2?","Mathematics","Problem Solving","Basic Math",1,1,"3","4","5","6","B","Basic arithmetic question.","mathematics,arithmetic,basic
"What is the primary color of the sky?","Science","Critical Thinking","Physics",1,1,"Red","Blue","Green","Yellow","B","The sky appears blue due to Rayleigh scattering.","science,physics,colors`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-questions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to download sample Excel file (CSV format for simplicity)
    const downloadSampleExcel = () => {
        // For Excel, we'll create a CSV file with .xlsx extension
        // In a real implementation, you might want to use a library like xlsx to create actual Excel files
        const csvContent = `question_text,domain,skill,concept,difficulty_level,max_score,option_a_text,option_b_text,option_c_text,option_d_text,correct_answer,problem_statement,tags
"What is the capital of France?","Geography","World Knowledge","Geography",2,1,"Paris","London","Berlin","Madrid","A","Paris is the capital and largest city of France.","geography,capitals,europe
"What is 2 + 2?","Mathematics","Problem Solving","Basic Math",1,1,"3","4","5","6","B","Basic arithmetic question.","mathematics,arithmetic,basic
"What is the primary color of the sky?","Science","Critical Thinking","Physics",1,1,"Red","Blue","Green","Yellow","B","The sky appears blue due to Rayleigh scattering.","science,physics,colors`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-questions.xlsx');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                questionTypes={questionTypes}
                onUploadSuccess={onRefreshLibrary}
                showBulkUpload={false}
                addToSectionButton={addToSectionButton}
                selectedCount={selectedCount}
                onClearSelection={() => {
                    setSelectedQuestions([]);
                    if (onSelectionChange) {
                        onSelectionChange(0);
                    }
                }}
            />

            {/* Question Creation Modal */}
            <QuestionCreationModal
                visible={isQuestionModalVisible}
                onCancel={() => setIsQuestionModalVisible(false)}
                onSuccess={async () => {
                    // Show success toast
                    showToast({
                        message: "Question Added Successfully",
                        description: "Your question has been added to the library successfully!",
                        position: "top-right",
                        duration: 4000,
                        type: "success"
                    });
                    
                    // Refresh My Library questions (will show at top due to sorting by created_at)
                    if (onRefreshLibrary) {
                        await onRefreshLibrary();
                    }
                    
                    // Trigger assessment refresh to update section data
                    if (onAssessmentRefresh) {
                        onAssessmentRefresh();
                    }
                    
                    // Close the modal
                    setIsQuestionModalVisible(false);
                }}
                questionTypes={questionTypes}
                assessmentId={assessmentId || ''}
                sectionId={sectionId || ''}
                onRefreshLibrary={onRefreshLibrary}
            />

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
                className="section-selection-modal [&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-header]:!bg-[var(--bg-primary)] [&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-body]:!text-[var(--text-primary)] [&_.ant-modal-close]:!text-[var(--text-primary)]"
            >
                <div className="mb-4">
                    <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
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
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
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
                                    style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="!bg-[#10B981] !border-[#10B981] !text-white hover:!bg-[#059669] hover:!border-[#059669]"
                                >
                                    Add to Section
                                </Button>
                            </div>
                        </Form>
                    )}
                </div>
            </Modal>

            {/* Legacy Create Question Modal - keeping for now but not used */}
            <Modal
                title={
                    <div style={{
                        fontFamily: "Helvetica_Neue-Medium, Helvetica",
                        fontWeight: "500",
                        fontSize: "20px",
                        color: "var(--text-primary)"
                    }}>
                        Create Custom Question
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={1200}
                className="custom-modal [&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-header]:!bg-[var(--bg-primary)] [&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-body]:!text-[var(--text-primary)] [&_.ant-modal-close]:!text-[var(--text-primary)]"
            >
                {/* Bulk Upload Section */}
                <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-base" style={{ fontFamily: "Helvetica_Neue-Medium, Helvetica", color: "var(--text-primary)" }}>
                            Bulk Upload Questions
                        </h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="bulk-upload-file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);

                                        // Handle file upload logic here
                                        // You can add file validation and processing
                                    }
                                }}
                            />
                            <label htmlFor="bulk-upload-file">
                                <Button
                                    type="primary"
                                    size="small"
                                    className="!bg-[#7C3AED] !border-[#7C3AED] !text-white hover:!bg-[#6D28D9] hover:!border-[#6D28D9] cursor-pointer"
                                >
                                    Choose File
                                </Button>
                            </label>
                        </div>
                    </div>
                    <p className="text-[#D2D2D3] text-sm mb-3">
                        Upload multiple questions at once using a CSV or Excel file.
                        Download sample files to understand the required format.
                    </p>
                    <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)<br />
                        <strong>Maximum file size:</strong> 10 MB<br />
                        <strong>Required columns:</strong> question_text, domain, skill, concept, difficulty_level, max_score, option_a_text, option_b_text, option_c_text, option_d_text, correct_answer, problem_statement, tags
                    </div>
                    <div className="flex gap-4 text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>Download sample:</span>
                        <a
                            href="/sample-questions.csv"
                            download="sample-questions.csv"
                            className="text-[#7C3AED] hover:text-[#6D28D9] underline cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                // Generate and download CSV sample
                                downloadSampleCSV();
                            }}
                        >
                            CSV
                        </a>
                        <span style={{ color: "var(--text-secondary)" }}>or</span>
                        <a
                            href="/sample-questions.xlsx"
                            download="sample-questions.xlsx"
                            className="text-[#7C3AED] hover:text-[#6D28D9] underline cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                // Generate and download Excel sample
                                downloadSampleExcel();
                            }}
                        >
                            Excel
                        </a>
                    </div>

                    {/* Selected File Display */}
                    {selectedFile && (
                        <div className="mt-3 p-3 bg-[#26272D] rounded-lg border border-[#3D475C]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#10B981] text-sm">✓</span>
                                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selectedFile.name}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <Button
                                    type="text"
                                    size="small"
                                    className="!text-[#EF4444] hover:!text-[#DC2626] !p-1"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="mt-2 flex gap-2">
                                <Button
                                    type="primary"
                                    size="small"
                                    className="!bg-[#10B981] !border-[#10B981] !text-white hover:!bg-[#059669] hover:!border-[#059669]"
                                    onClick={() => {
                                        // Handle file upload processing

                                    }}
                                >
                                    Process File
                                </Button>
                                <Button
                                    size="small"
                                    style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                                    onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-4"
                >
                    {/* Question Type and Category Selection */}
                    <Row gutter={16}>
                        {/* Left Column - Question Type */}
                        <Col span={12}>
                            <Form.Item
                                name="question_type_id"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Question Type
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a question type!' }]}
                            >
                                <Select
                                    placeholder="Select question type"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={
                                        questionTypes?.items?.[0]?.attributes?.data?.question_types
                                            ?.filter(qt => qt.enabled)
                                            ?.map(qt => ({
                                                label: qt.label,
                                                value: qt.id
                                            })) || []
                                    }
                                    onChange={(value) => {
                                        // Auto-set the category when question type is selected
                                        if (value && questionTypes?.items?.[0]?.attributes?.data?.question_types) {
                                            const selectedQuestionType = questionTypes.items[0].attributes.data.question_types.find(qt => qt.id === value);
                                            if (selectedQuestionType?.category_id) {
                                                form.setFieldValue('category_id', selectedQuestionType.category_id);
                                            }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column - Category */}
                        <Col span={12}>
                            <Form.Item
                                name="category_id"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Category
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a category!' }]}
                            >
                                <Select
                                    placeholder="Select category (auto-filled based on question type)"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={
                                        questionTypes?.items?.[0]?.attributes?.data?.categories
                                            ?.filter(cat => cat.enabled)
                                            ?.map(cat => ({
                                                label: cat.label,
                                                value: cat.id
                                            })) || []
                                    }
                                    disabled={true}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Two Column Layout for Question Text, Domain, Skill */}
                    <Row gutter={16}>
                        {/* Left Column - Question Text */}
                        <Col span={12}>
                            <Form.Item
                                name="question_text"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Question Text
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter the question text!' }]}
                            >
                                <Input
                                    placeholder="Enter question text"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column - Domain */}
                        <Col span={12}>
                            <Form.Item
                                name="domain"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Domain
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a domain!' }]}
                            >
                                <Select
                                    placeholder="Select domain"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={[
                                        { label: "Geography", value: "Geography" },
                                        { label: "Mathematics", value: "Mathematics" },
                                        { label: "Science", value: "Science" },
                                        { label: "History", value: "History" },
                                        { label: "Literature", value: "Literature" },
                                        { label: "Computer Science", value: "Computer Science" },
                                        { label: "Economics", value: "Economics" },
                                        { label: "Psychology", value: "Psychology" },
                                        { label: "Art", value: "Art" },
                                        { label: "Music", value: "Music" }
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Skill Field - Full Width */}
                    <Form.Item
                        name="skill"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Skill
                            </span>
                        }
                        rules={[{ required: true, message: 'Please select a skill!' }]}
                    >
                        <Select
                            placeholder="Select skill"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            options={[
                                { label: "World Knowledge", value: "World Knowledge" },
                                { label: "Problem Solving", value: "Problem Solving" },
                                { label: "Critical Thinking", value: "Critical Thinking" },
                                { label: "Analytical Skills", value: "Analytical Skills" },
                                { label: "Memory", value: "Memory" },
                                { label: "Logical Reasoning", value: "Logical Reasoning" },
                                { label: "Creativity", value: "Creativity" },
                                { label: "Communication", value: "Communication" }
                            ]}
                        />
                    </Form.Item>

                    {/* Problem Statement Field - Full Width */}
                    <Form.Item
                        name="problemStatement"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Problem Statement
                            </span>
                        }
                        rules={[
                            { required: true, message: 'Please enter the problem statement!' },
                            {
                                validator: (_, value) => {
                                    // Remove HTML tags and check if there's actual content
                                    const textContent = value ? value.replace(/<[^>]*>/g, '').trim() : '';
                                    if (!textContent || textContent.length < 10) {
                                        return Promise.reject(new Error('Please enter a meaningful problem statement (at least 10 characters)!'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <div className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)] !rounded-lg">
                            <style>{tiptapStyles}</style>
                            {/* Toolbar */}
                            <div className="flex flex-wrap gap-1 p-2 border-b rounded-t-lg" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                    style={{ color: editor?.isActive('bold') ? '#ffffff' : 'var(--text-primary)' }}
                                    className={`hover:!text-[#7C3AED] ${editor?.isActive('bold') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    B
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('italic') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    I
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('strike') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    S
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('heading', { level: 1 }) ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    H1
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('heading', { level: 2 }) ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    H2
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('bulletList') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    •
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('orderedList') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    1.
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('blockquote') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    "
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('codeBlock') ? '!bg-[#7C3AED] !text-white' : ''}`}
                                >
                                    {'</>'}
                                </Button>
                            </div>
                            {/* Editor Content */}
                            <div style={{ 
                                maxHeight: '200px', 
                                overflowY: 'auto',
                                padding: '12px',
                                backgroundColor: '#26272D',
                                borderTop: '1px solid #3D475C'
                            }}>
                                <EditorContent 
                                    editor={editor} 
                                    style={{
                                        minHeight: '150px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                            {/* Content indicator */}
                            <div className={`text-xs px-3 py-1 rounded-b-lg border-t flex justify-between items-center ${editorContent && editorContent !== '<p></p>' && editorContent !== '<p><br></p>' &&
                                (() => {
                                    const textContent = editorContent ? editorContent.replace(/<[^>]*>/g, '').trim() : '';
                                    return textContent.length >= 10;
                                })()
                                ? 'bg-[#1a1a1a] border-[#10B981] text-[#10B981]'
                                : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                                }`}>
                                <span>
                                    {editorContent && editorContent !== '<p></p>' && editorContent !== '<p><br></p>'
                                        ? (() => {
                                            const textContent = editorContent ? editorContent.replace(/<[^>]*>/g, '').trim() : '';
                                            return textContent.length >= 10 ? 'Content entered ✓' : 'Content entered (minimum 10 characters required)';
                                        })()
                                        : 'Please enter your problem statement...'}
                                </span>
                                <span>
                                    {(() => {
                                        const textContent = editorContent ? editorContent.replace(/<[^>]*>/g, '').trim() : '';
                                        return `${textContent.length} characters`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </Form.Item>

                    {/* Two Column Layout for Other Fields */}
                    <Row gutter={16}>
                        {/* Left Column */}
                        <Col span={12}>
                            {/* Difficulty Level Field */}
                            <Form.Item
                                name="difficulty_level"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Difficulty Level
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select difficulty level!' }]}
                            >
                                <Select
                                    placeholder="Select difficulty level"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={[
                                        { label: "Beginner (1)", value: 1 },
                                        { label: "Easy (2)", value: 2 },
                                        { label: "Medium (3)", value: 3 },
                                        { label: "Hard (4)", value: 4 },
                                        { label: "Expert (5)", value: 5 }
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column */}
                        <Col span={12}>
                            {/* Max Score Field */}
                            <Form.Item
                                name="max_score"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Max Score
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter max score!' }]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Enter max score"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    min={1}
                                    defaultValue={1}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Options Field */}
                    <Form.Item
                        name="options"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Question Options
                            </span>
                        }
                        rules={[{ required: true, message: 'Please add all options!' }]}
                    >
                        <div className="space-y-3">
                            {['A', 'B', 'C', 'D'].map((option) => (
                                <div key={option} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                    <Radio
                                        name="correct_answer"
                                        value={option}
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <span style={{ color: "var(--text-primary)" }}>Option {option}:</span>
                                    </Radio>
                                    <Input
                                        placeholder={`Enter option ${option} text`}
                                        className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)] flex-1"
                                        style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                        name={`option_${option.toLowerCase()}_text`}
                                    />
                                </div>
                            ))}
                        </div>
                    </Form.Item>

                    {/* Correct Answer Selection */}
                    <Form.Item
                        name="correct_answer"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Correct Answer
                            </span>
                        }
                        rules={[{ required: true, message: 'Please select the correct answer!' }]}
                    >
                        <Radio.Group className="!text-white">
                            {['A', 'B', 'C', 'D'].map((option) => (
                                <Radio key={option} value={option} style={{ color: "var(--text-primary)" }}>
                                    <span style={{ color: "var(--text-primary)" }}>Option {option}</span>
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>

                    {/* Two Column Layout for Concepts and Tags */}
                    <Row gutter={16}>
                        {/* Left Column - Concepts */}
                        <Col span={12}>
                            <Form.Item
                                name="concept"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Select Concepts
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select at least one concept!' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Search and select concepts..."
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={conceptOptions}
                                    filterOption={(input, option) =>
                                        option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                    showSearch
                                    optionLabelProp="label"
                                    popupRender={(menu) => (
                                        <>
                                            {menu}
                                            <div style={{ padding: '8px', borderTop: '1px solid #3D475C' }}>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    onClick={() => {
                                                        // You can implement a concept addition modal here

                                                    }}
                                                    className="!text-[#7C3AED] hover:!text-[#7C3AED]"
                                                >
                                                    + Add New Concept
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column - Tags */}
                        <Col span={12}>
                            <Form.Item
                                name="tags"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Tags
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please add at least one tag!' }]}
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Add tags (press Enter to add)"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={[
                                        { label: "geography", value: "geography" },
                                        { label: "europe", value: "europe" },
                                        { label: "capitals", value: "capitals" },
                                        { label: "mathematics", value: "mathematics" },
                                        { label: "science", value: "science" },
                                        { label: "programming", value: "programming" },
                                        { label: "algorithms", value: "algorithms" },
                                        { label: "data-structures", value: "data-structures" }
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Additional Fields for API */}
                    <Row gutter={16}>
                        {/* Left Column - Time Limit */}
                        <Col span={12}>
                            <Form.Item
                                name="time_limit"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Time Limit (minutes)
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter time limit!' }]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Enter time limit in minutes"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    min={1}
                                    defaultValue={5}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column - Reading Level */}
                        <Col span={12}>
                            <Form.Item
                                name="reading_level"
                                label={
                                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Reading Level
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select reading level!' }]}
                            >
                                <Select
                                    placeholder="Select reading level"
                                    className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                                    style={{ color: "var(--text-primary)", borderRadius: "8px" }}
                                    options={[
                                        { label: "Beginner", value: "beginner" },
                                        { label: "Intermediate", value: "intermediate" },
                                        { label: "Advanced", value: "advanced" },
                                        { label: "Expert", value: "expert" }
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Answer Format Field */}
                    <Form.Item
                        name="answer_format"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Answer Format
                            </span>
                        }
                        rules={[{ required: true, message: 'Please enter answer format!' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter the expected answer format (e.g., 'Enter a single letter: A, B, C, or D')"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            rows={3}
                        />
                    </Form.Item>

                    {/* Expected Output Field */}
                    <Form.Item
                        name="expected_output"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Expected Output
                            </span>
                        }
                        rules={[{ required: true, message: 'Please enter expected output!' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter the expected output or result"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            rows={3}
                        />
                    </Form.Item>

                    {/* Sample Answer Field */}
                    <Form.Item
                        name="sample_answer"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Sample Answer
                            </span>
                        }
                        rules={[{ required: true, message: 'Please enter sample answer!' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter a sample answer for reference"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            rows={3}
                        />
                    </Form.Item>

                    {/* Scoring Guidelines Field */}
                    <Form.Item
                        name="scoring_guidelines"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Scoring Guidelines
                            </span>
                        }
                        rules={[{ required: true, message: 'Please enter scoring guidelines!' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter scoring guidelines and criteria"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            rows={3}
                        />
                    </Form.Item>

                    {/* Hints Field */}
                    <Form.Item
                        name="hints"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Hints
                            </span>
                        }
                    >
                        <Select
                            mode="tags"
                            placeholder="Add hints (press Enter to add)"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                        />
                    </Form.Item>

                    {/* Languages Field */}
                    <Form.Item
                        name="languages"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Programming Languages (if applicable)
                            </span>
                        }
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select programming languages"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            options={[
                                { label: "JavaScript", value: "javascript" },
                                { label: "Python", value: "python" },
                                { label: "Java", value: "java" },
                                { label: "C++", value: "cpp" },
                                { label: "C#", value: "csharp" },
                                { label: "PHP", value: "php" },
                                { label: "Ruby", value: "ruby" },
                                { label: "Go", value: "go" },
                                { label: "Rust", value: "rust" },
                                { label: "Swift", value: "swift" }
                            ]}
                        />
                    </Form.Item>

                    {/* Expected Keywords Field */}
                    <Form.Item
                        name="expected_keywords"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Expected Keywords
                            </span>
                        }
                    >
                        <Select
                            mode="tags"
                            placeholder="Add expected keywords (press Enter to add)"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                        />
                    </Form.Item>

                    {/* Test Cases Field */}
                    <Form.Item
                        name="test_cases"
                        label={
                            <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Test Cases
                            </span>
                        }
                    >
                        <Input.TextArea
                            placeholder="Enter test cases in JSON format (e.g., [{'input': 'test', 'output': 'result'}])"
                            className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
                            style={{ borderRadius: "8px", color: "var(--text-primary)" }}
                            rows={4}
                        />
                    </Form.Item>

                    {/* Submit Button */}
                    <Form.Item className="!mt-6 !mb-0">
                        <div className="flex justify-end gap-3">
                            <Button onClick={handleCancel} className="!border-[#3D475C] !text-white">
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="!bg-[#7C3AED] !border-[#7C3AED] !text-white hover:!bg-[#6D28D9] hover:!border-[#6D28D9]"
                            >
                                Create Question
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Loading State */}
            {isLoadingQuestions && myLibraryData.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
                        <span className="text-lg" style={{ color: "var(--text-primary)" }}>Loading questions...</span>
                    </div>
                </div>
            )}

            {/* No Questions State */}
            {!isLoadingQuestions && myLibraryData.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>No questions found</div>
                        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Create your first question to get started</div>
                    </div>
                </div>
            )}


            {/* Questions List */}
            {myLibraryData.length > 0 &&
                myLibraryData
                    .map((item, index) => {
                        const questionId = item.unique_id;
                        const isInAssessment = isQuestionInAssessment(questionId);
                        return { item, index, isInAssessment };
                    })
                    .map(({ item, index, isInAssessment }) => (
                    <div key={item.unique_id || index} className="group !relative !w-full !rounded-[8px] !overflow-hidden !mt-5">
                    <Card
                            className={`h-auto !rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 !m-[2px] ${
                            isQuestionSelected(item.unique_id || `item-${index}`) 
                                ? '!border-[#10B981] !border-2 selected-card' 
                                : isInAssessment
                                ? '!border-[var(--accent-primary)] !border-2'
                                : ''
                        }`}
                        style={{
                            position: "relative",
                            borderRadius: "14px",
                            border: isQuestionSelected(item.unique_id || `item-${index}`) 
                                ? "2px solid #10B981" 
                                : isInAssessment
                                ? "2px solid var(--accent-primary)"
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
                                    e.currentTarget.style.borderColor = "var(--accent-primary)";
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

                                {/* Hints - Show hints as plain text instead of repeating question */}
                                {item.hints && item.hints.length > 0 && (
                                    <div className="mb-4">
                                        {Array.isArray(item.hints) ? (
                                            item.hints.map((hint, hintIdx) => (
                                                <p
                                                    key={hintIdx}
                                                    style={{
                                                        fontFamily: "Helvetica_Neue-Regular, Helvetica",
                                                        fontWeight: "400",
                                                        color: "#BFBFBF",
                                                        fontSize: "14px",
                                                        lineHeight: "1.6",
                                                        marginBottom: hintIdx < item.hints.length - 1 ? "8px" : "0",
                                                    }}
                                                >
                                                    {hint}
                                                </p>
                                            ))
                                        ) : (
                                            <p
                                                style={{
                                                    fontFamily: "Helvetica_Neue-Regular, Helvetica",
                                                    fontWeight: "400",
                                                    color: "#BFBFBF",
                                                    fontSize: "14px",
                                                    lineHeight: "1.6",
                                                }}
                                            >
                                                {item.hints}
                                            </p>
                                        )}
                                </div>
                                )}

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
                                <div style={{ padding: "0 20px 20px 20px" }}>
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

                                                {/* Hints */}
                                                {item.hints && item.hints.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                            Hints:
                                                        </div>
                                                        <div className="space-y-2">
                                                            {Array.isArray(item.hints) ? (
                                                                item.hints.map((hint, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="p-3 !border !rounded-lg" 
                                                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                                                                    >
                                                                        <span style={{ color: 'var(--text-primary)' }}>
                                                                            {hint}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-3 !border !rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                                                    <span style={{ color: 'var(--text-primary)' }}>
                                                                        {item.hints}
                                                                    </span>
                                                                </div>
                                                            )}
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
                                </div>
                            )}
                    </Card>
                    </div>
                ))}



            {/* Load More Button */}
            {hasMoreQuestions && myLibraryData.length > 0 && (
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
        </>
    )
}
