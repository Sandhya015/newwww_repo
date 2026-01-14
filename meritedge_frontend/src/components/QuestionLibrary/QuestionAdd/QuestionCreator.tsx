import { Button, Modal, Form, Input, Select, Row, Col, message } from "antd";
import { useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// API
import { createQuestions } from "../../../lib/api";

// Custom styles for TipTap
const tiptapStyles = `
  .tiptap {
    color: white !important;
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
    color: white !important;
  }
  .tiptap h1, .tiptap h2, .tiptap h3 {
    color: white !important;
    margin: 0.3em 0;
  }
  .tiptap ul, .tiptap ol {
    padding-left: 1.5em;
    margin: 0.3em 0;
  }
  .tiptap li {
    color: white !important;
  }
  .tiptap blockquote {
    border-left: 3px solid #7C3AED;
    margin: 0.3em 0;
    padding-left: 1em;
    color: #D2D2D3;
  }
  .tiptap code {
    background: #3D475C;
    padding: 2px 4px;
    border-radius: 4px;
    color: #F9A216;
  }
  .tiptap pre {
    background: #1a1a1a;
    padding: 0.5em;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.3em 0;
  }
  .tiptap:focus {
    outline: none;
  }
`;

interface QuestionCreatorProps {
    questionTypes: any;
    assessmentId?: string;
    sectionId?: string;
    onQuestionCreated?: () => void;
}

export default function QuestionCreator({ 
    questionTypes, 
    assessmentId, 
    sectionId, 
    onQuestionCreated 
}: QuestionCreatorProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [form] = Form.useForm();

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getHTML());
            form.setFieldValue('problemStatement', editor.getHTML());
        },
    });

    const handleSubmit = async (values: any) => {
        try {
            // Parse options from form values
            const options = [
                { text: values.option_a, is_correct: values.correct_answer === 'A' },
                { text: values.option_b, is_correct: values.correct_answer === 'B' },
                { text: values.option_c, is_correct: values.correct_answer === 'C' },
                { text: values.option_d, is_correct: values.correct_answer === 'D' }
            ];

            // Get correct answers
            const correctAnswers = options
                .filter(option => option.is_correct)
                .map(option => option.text);

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
                test_cases: [],
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
                company_id: "",
                organization_id: "",
                library_scope: "company"
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

            message.success('Question created successfully!');

            // Close modal and reset form
            setIsModalVisible(false);
            form.resetFields();
            if (editor) {
                editor.commands.setContent('');
            }
            form.setFieldValue('problemStatement', '');
            setEditorContent('');

            // Call the callback to refresh the question list
            if (onQuestionCreated) {
                onQuestionCreated();
            }

        } catch (error) {
            console.error('Error creating question:', error);
            message.error('Failed to create question. Please try again.');
        }
    };

    return (
        <>
            <Button
                type="primary"
                onClick={() => setIsModalVisible(true)}
                className="!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6D28D9] hover:!border-[#6D28D9]"
            >
                Create Question
            </Button>

            <Modal
                title={
                    <span style={{ color: "var(--text-primary)", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                        Create New Question
                    </span>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={800}
                className="question-creator-modal"
                styles={{
                    content: {
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    },
                    header: {
                        backgroundColor: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-primary)'
                    }
                }}
            >
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
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Question Type
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a question type!' }]}
                            >
                                <Select
                                    placeholder="Select question type"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
                                    options={
                                        questionTypes?.items?.[0]?.attributes?.data?.question_types
                                            ?.filter((qt: any) => qt.enabled)
                                            ?.map((qt: any) => ({
                                                label: qt.label,
                                                value: qt.id
                                            })) || []
                                    }
                                    onChange={(value) => {
                                        // Auto-set the category when question type is selected
                                        if (value && questionTypes?.items?.[0]?.attributes?.data?.question_types) {
                                            const selectedQuestionType = questionTypes.items[0].attributes.data.question_types.find((qt: any) => qt.id === value);
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
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Category
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a category!' }]}
                            >
                                <Select
                                    placeholder="Select category (auto-filled based on question type)"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
                                    options={
                                        questionTypes?.items?.[0]?.attributes?.data?.categories
                                            ?.filter((cat: any) => cat.enabled)
                                            ?.map((cat: any) => ({
                                                label: cat.label,
                                                value: cat.id
                                            })) || []
                                    }
                                    disabled={true}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Question Text */}
                    <Form.Item
                        name="question_text"
                        label={
                            <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Question Text
                            </span>
                        }
                        rules={[{ required: true, message: 'Please enter the question text!' }]}
                    >
                        <Input
                            placeholder="Enter question text"
                            className="!bg-[#26272D] !border-[#3D475C] !text-white"
                            style={{ borderRadius: "8px" }}
                        />
                    </Form.Item>

                    {/* Domain and Skill */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="domain"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Domain
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a domain!' }]}
                            >
                                <Select
                                    placeholder="Select domain"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
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
                        <Col span={12}>
                            <Form.Item
                                name="skill"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Skill
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select a skill!' }]}
                            >
                                <Select
                                    placeholder="Select skill"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
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
                        </Col>
                    </Row>

                    {/* Problem Statement */}
                    <Form.Item
                        name="problemStatement"
                        label={
                            <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Problem Statement
                            </span>
                        }
                        rules={[
                            { required: true, message: 'Please enter the problem statement!' },
                            {
                                validator: (_, value) => {
                                    const textContent = value ? value.replace(/<[^>]*>/g, '').trim() : '';
                                    if (!textContent || textContent.length < 10) {
                                        return Promise.reject(new Error('Please enter a meaningful problem statement (at least 10 characters)!'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <div className="!bg-[#26272D] !border-[#3D475C] !rounded-lg">
                            <style>{tiptapStyles}</style>
                            <div className="flex flex-wrap gap-1 p-2 border-b rounded-t-lg" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                    className={`!text-white hover:!text-[#7C3AED] ${editor?.isActive('bold') ? '!bg-[#7C3AED] !text-white' : ''}`}
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
                            </div>
                            <div className="p-3">
                                <EditorContent editor={editor} />
                            </div>
                        </div>
                    </Form.Item>

                    {/* Difficulty Level and Max Score */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="difficulty_level"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Difficulty Level
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select difficulty level!' }]}
                            >
                                <Select
                                    placeholder="Select difficulty level"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
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
                        <Col span={12}>
                            <Form.Item
                                name="max_score"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Max Score
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter max score!' }]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Enter max score"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
                                    min={1}
                                    defaultValue={1}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Options */}
                    <Form.Item
                        name="options"
                        label={
                            <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                Question Options
                            </span>
                        }
                        rules={[{ required: true, message: 'Please add all options!' }]}
                    >
                        <div className="space-y-3">
                            {['A', 'B', 'C', 'D'].map((option) => (
                                <div key={option} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        value={option}
                                        className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    />
                                    <Input
                                        placeholder={`Option ${option}`}
                                        className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                        style={{ borderRadius: "8px" }}
                                        name={`option_${option.toLowerCase()}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </Form.Item>

                    {/* Additional Fields */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="scoring_guidelines"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Scoring Guidelines
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter scoring guidelines!' }]}
                            >
                                <Input.TextArea
                                    placeholder="Enter scoring guidelines and criteria"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
                                    rows={3}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="sample_answer"
                                label={
                                    <span style={{ color: "white", fontFamily: "Helvetica_Neue-Medium, Helvetica" }}>
                                        Sample Answer
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter a sample answer!' }]}
                            >
                                <Input.TextArea
                                    placeholder="Enter a sample answer for reference"
                                    className="!bg-[#26272D] !border-[#3D475C] !text-white"
                                    style={{ borderRadius: "8px" }}
                                    rows={3}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Submit Button */}
                    <Form.Item className="mb-0">
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={() => setIsModalVisible(false)}
                                className="!border-[#3D475C] !text-white hover:!border-[#7C3AED]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6D28D9] hover:!border-[#6D28D9]"
                            >
                                Create Question
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
