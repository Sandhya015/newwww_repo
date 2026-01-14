import React from 'react';
import { Card, Typography, Tag, Space, Divider, Row, Col } from 'antd';
import { ClockCircleOutlined, TrophyOutlined, TagOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Question {
    question_id: string;
    question_text: string;
    question_type: string;
    difficulty_level: string;
    max_score: string;
    time_limit: string;
    domain: string;
    skill: string;
    tags: string[];
    hints: string[];
    options?: Array<{
        text: string;
        is_correct: boolean;
    }>;
    description?: string;
    answer_format?: string;
    expected_output?: string;
}

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    questionType: string;
}

const normalizeType = (type?: string) =>
    (type || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const QUESTION_TYPE_LABELS: Record<string, string> = {
    qt001: 'Single Choice',
    mcqsingle: 'Single Choice',
    singlechoice: 'Single Choice',
    qt002: 'Multiple Choice',
    mcqmultiple: 'Multiple Choice',
    multiplechoice: 'Multiple Choice',
    qt003: 'True / False',
    truefalse: 'True / False',
    qt004: 'Fill in the Blanks',
    fillintheblanks: 'Fill in the Blanks',
    fillintheblank: 'Fill in the Blanks',
    qt006: 'Subjective',
    subjective: 'Subjective',
    essay: 'Subjective',
    qt007: 'Coding',
    coding: 'Coding',
    qt008: 'Video Response',
    qt009: 'Audio-Video Response',
    qt010: 'Matching',
    qt011: 'Project-Based Assessment',
    qt012: 'Case Study',
    qt013: 'Simulation',
    qt014: 'Ranking',
    qt015: 'Drag and Drop',
    qt016: 'Hotspot',
    qt017: 'Cognitive Ability Test',
    qt018: 'Situational Judgment',
    qt019: 'Response Time Test',
    qt020: 'Pattern Recognition',
    qt021: 'Memory Recall',
    qt022: 'Audio Response',
    text: 'Text Answer',
    descriptive: 'Text Answer',
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
    qt001: 'blue',
    mcqsingle: 'blue',
    singlechoice: 'blue',
    qt002: 'purple',
    mcqmultiple: 'purple',
    multiplechoice: 'purple',
    qt003: 'geekblue',
    truefalse: 'geekblue',
    qt004: 'cyan',
    fillintheblanks: 'cyan',
    fillintheblank: 'cyan',
    qt006: 'magenta',
    subjective: 'magenta',
    essay: 'magenta',
    qt007: 'green',
    coding: 'green',
    qt008: 'volcano',
    qt009: 'volcano',
    qt010: 'gold',
    qt011: 'gold',
    qt012: 'gold',
    qt013: 'gold',
    qt014: 'gold',
    qt015: 'gold',
    qt016: 'gold',
    qt017: 'purple',
    qt018: 'purple',
    qt019: 'purple',
    qt020: 'purple',
    qt021: 'purple',
    qt022: 'purple',
    text: 'orange',
    descriptive: 'orange',
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionNumber, questionType }) => {
    const normalizedType = normalizeType(questionType) || normalizeType(question.question_type);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case '1':
            case 'easy':
                return 'green';
            case '2':
            case 'medium':
                return 'orange';
            case '3':
            case '4':
            case '5':
            case 'hard':
            case 'advanced':
                return 'red';
            default:
                return 'default';
        }
    };

    const getQuestionTypeColor = (type: string) => {
        const key = normalizeType(type);
        return QUESTION_TYPE_COLORS[key] || 'default';
    };

    const formatQuestionType = (type: string) => {
        const key = normalizeType(type);
        return QUESTION_TYPE_LABELS[key] || type || 'Unknown';
    };

    const displayTypeSource = normalizedType ? (questionType || question.question_type) : question.question_type;
    const displayType = formatQuestionType(displayTypeSource || 'Unknown');
    const typeColor = getQuestionTypeColor(displayTypeSource || '');

    return (
        <Card 
            className="bg-[#2a2a2a] border-[#444] hover:border-[#7C3AED] transition-all duration-200"
            bodyStyle={{ padding: '20px' }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-[#7C3AED] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {questionNumber}
                    </div>
                    <div>
                        <Title level={5} className="!text-white !mb-1">
                            Question {questionNumber}
                        </Title>
                        <div className="flex items-center gap-2">
                            <Tag color={typeColor}>
                                {displayType}
                            </Tag>
                            <Tag color={getDifficultyColor(question.difficulty_level)}>
                                Level {question.difficulty_level}
                            </Tag>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                            <TrophyOutlined />
                            <span>{question.max_score} pts</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <ClockCircleOutlined />
                            <span>{question.time_limit} min</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
                <Paragraph className="!text-white !text-base !mb-0">
                    {question.question_text}
                </Paragraph>
            </div>

            {/* Description */}
            {question.description && (
                <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
                    <Text className="text-gray-400 text-sm block mb-1">Description:</Text>
                    <Text className="text-white text-sm">{question.description}</Text>
                </div>
            )}

            {/* Options for MCQ */}
            {question.options && question.options.length > 0 && (
                <div className="mb-4">
                    <Text className="text-gray-400 text-sm block mb-2">Options:</Text>
                    <Space direction="vertical" size="small" className="w-full">
                        {question.options.map((option, index) => (
                            <div 
                                key={`${question.question_id}-option-${index}`}
                                className={`p-3 rounded-lg border ${
                                    option.is_correct 
                                        ? 'bg-green-900/20 border-green-500' 
                                        : 'bg-[#1a1a1a] border-[#444]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        option.is_correct 
                                            ? 'border-green-500 bg-green-500' 
                                            : 'border-gray-400'
                                    }`}>
                                        {option.is_correct && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <Text className={`text-sm ${
                                        option.is_correct ? 'text-green-400' : 'text-white'
                                    }`}>
                                        {String.fromCharCode(65 + index)}. {option.text}
                                    </Text>
                                    {option.is_correct && (
                                        <Tag color="green">Correct</Tag>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Space>
                </div>
            )}

            {/* Answer Format for Coding Questions */}
            {question.answer_format && (
                <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
                    <Text className="text-gray-400 text-sm block mb-1">Answer Format:</Text>
                    <Text className="text-white text-sm">{question.answer_format}</Text>
                </div>
            )}

            {/* Expected Output for Coding Questions */}
            {question.expected_output && (
                <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
                    <Text className="text-gray-400 text-sm block mb-1">Expected Output:</Text>
                    <Text className="text-white text-sm font-mono">{question.expected_output}</Text>
                </div>
            )}

            {/* Hints */}
            {question.hints && question.hints.length > 0 && (
                <div className="mb-4">
                    <Text className="text-gray-400 text-sm block mb-2">
                        <BulbOutlined className="mr-1" />
                        Hints:
                    </Text>
                    <ul className="list-disc list-inside text-white text-sm space-y-1">
                        {question.hints.map((hint, index) => (
                            <li key={`${question.question_id}-hint-${index}`} className="text-gray-300">{hint}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Divider className="!border-[#444] my-4" />

            {/* Question Metadata */}
            <Row gutter={[16, 8]}>
                <Col span={8}>
                    <div>
                        <Text className="text-gray-400 text-xs block">Domain</Text>
                        <Text className="text-white text-sm font-medium">{question.domain}</Text>
                    </div>
                </Col>
                <Col span={8}>
                    <div>
                        <Text className="text-gray-400 text-xs block">Skill</Text>
                        <Text className="text-white text-sm font-medium">{question.skill}</Text>
                    </div>
                </Col>
                <Col span={8}>
                    <div>
                        <Text className="text-gray-400 text-xs block">Question Type ID</Text>
                        <Text className="text-white text-sm font-mono">{questionType}</Text>
                    </div>
                </Col>
            </Row>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
                <div className="mt-4">
                    <Text className="text-gray-400 text-xs block mb-2">
                        <TagOutlined className="mr-1" />
                        Tags:
                    </Text>
                    <Space wrap>
                        {question.tags.map((tag, index) => (
                            <Tag key={`${question.question_id}-tag-${index}`} color="blue" className="text-xs">
                                {tag}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}
        </Card>
    );
};

export default QuestionCard;
