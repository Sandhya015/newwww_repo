import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button, Spin, message, Tag, Divider, Collapse, Space } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, UserOutlined, BookOutlined, TrophyOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import { getAssessment } from '../../lib/api';
import QuestionCard from '../../components/AssessmentDetail/QuestionCard';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface AssessmentData {
    unique_id: string;
    title: string;
    assessment_type: string;
    status: string;
    difficulty_level: string;
    target_role: string;
    target_experience: string;
    total_score: string;
    question_count: string;
    section_count: string;
    created_at: string;
    created_by_email: string;
    sections: Array<{
        section_id: string;
        section_name: string;
        question_count: string;
        total_score: string;
        section_order: string;
        questions: Record<string, Array<{
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
        }>>;
        section_settings?: {
            duration: string;
            passing_score: string;
            break_duration: string;
        };
        proctoring?: Record<string, {
            enable: boolean;
            order: string;
        }>;
    }>;
    general_settings?: {
        cut_off_marks: {
            percentage: string;
        };
    };
    settings?: {
        invite_start_date: string;
        invite_end_date: string;
        candidate_window: string;
    };
}

const AssessmentDetail: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (assessmentId) {
            fetchAssessmentDetails();
        }
    }, [assessmentId]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [assessmentId]);

    const fetchAssessmentDetails = async () => {
        try {
            setLoading(true);
            const response = await getAssessment(assessmentId!);
            console.log('Assessment data received:', response.data);
            setAssessmentData(response.data);
        } catch (error) {
            console.error('Error fetching assessment details:', error);
            message.error('Failed to fetch assessment details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'draft':
                return 'orange';
            case 'completed':
                return 'blue';
            default:
                return 'default';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'green';
            case 'medium':
                return 'orange';
            case 'hard':
            case 'advanced':
                return 'red';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!assessmentData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card>
                    <Text>Assessment not found</Text>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/cognitive')}
                        className="!text-white hover:!text-[#7C3AED] mb-4"
                    >
                        Back to Assessments
                    </Button>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={1} className="!text-white !mb-2">
                                {assessmentData.title}
                            </Title>
                            <div className="flex items-center gap-4 mb-4">
                                <Tag color={getStatusColor(assessmentData.status)} className="text-sm px-3 py-1">
                                    {assessmentData.status.toUpperCase()}
                                </Tag>
                                <Tag color={getDifficultyColor(assessmentData.difficulty_level)} className="text-sm px-3 py-1">
                                    {assessmentData.difficulty_level}
                                </Tag>
                                <Text className="text-gray-400">
                                    <UserOutlined className="mr-1" />
                                    {assessmentData.created_by_email}
                                </Text>
                                <Text className="text-gray-400">
                                    <ClockCircleOutlined className="mr-1" />
                                    {formatDate(assessmentData.created_at)}
                                </Text>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-[#7C3AED]">{assessmentData.question_count}</div>
                                    <div className="text-sm text-gray-400">Questions</div>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-[#7C3AED]">{assessmentData.total_score}</div>
                                    <div className="text-sm text-gray-400">Total Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assessment Overview */}
                <Card className="mb-6 bg-[#1a1a1a] border-[#333]">
                    <Title level={3} className="!text-white !mb-4">
                        <BookOutlined className="mr-2" />
                        Assessment Overview
                    </Title>
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <div className="text-center">
                                <Text className="text-gray-400 block">Assessment Type</Text>
                                <Text className="text-white text-lg font-semibold">{assessmentData.assessment_type}</Text>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className="text-center">
                                <Text className="text-gray-400 block">Target Role</Text>
                                <Text className="text-white text-lg font-semibold">{assessmentData.target_role}</Text>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className="text-center">
                                <Text className="text-gray-400 block">Experience Level</Text>
                                <Text className="text-white text-lg font-semibold">{assessmentData.target_experience} years</Text>
                            </div>
                        </Col>
                    </Row>
                    
                    {assessmentData.general_settings?.cut_off_marks && (
                        <Divider className="!border-[#333] my-4" />
                    )}
                    
                    {assessmentData.general_settings?.cut_off_marks && (
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <div className="text-center">
                                    <Text className="text-gray-400 block">Cut-off Marks</Text>
                                    <Text className="text-white text-lg font-semibold">
                                        {assessmentData.general_settings.cut_off_marks.percentage}%
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Card>

                {/* Sections */}
                <Card className="mb-6 bg-[#1a1a1a] border-[#333]">
                    <Title level={3} className="!text-white !mb-4">
                        <TrophyOutlined className="mr-2" />
                        Assessment Sections ({assessmentData.section_count})
                    </Title>
                    
                    <Collapse
                        defaultActiveKey={['0']}
                        className="bg-transparent"
                        expandIconPosition="right"
                    >
                        {assessmentData.sections.map((section, sectionIndex) => (
                            <Panel
                                key={section.section_id}
                                header={
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <div>
                                            <Text className="text-white text-lg font-semibold">
                                                {section.section_name}
                                            </Text>
                                            <div className="flex items-center gap-4 mt-1">
                                                <Text className="text-gray-400">
                                                    {section.question_count} Questions
                                                </Text>
                                                <Text className="text-gray-400">
                                                    {section.total_score} Points
                                                </Text>
                                                {section.section_settings?.duration && (
                                                    <Text className="text-gray-400">
                                                        <ClockCircleOutlined className="mr-1" />
                                                        {section.section_settings.duration} min
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag color="blue">Order: {section.section_order}</Tag>
                                        </div>
                                    </div>
                                }
                                className="!bg-[#2a2a2a] !border-[#444] !mb-2"
                            >
                                {/* Section Settings */}
                                {section.section_settings && (
                                    <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg">
                                        <Title level={5} className="!text-white !mb-3">
                                            <SettingOutlined className="mr-2" />
                                            Section Settings
                                        </Title>
                                        <Row gutter={[16, 8]}>
                                            {section.section_settings.duration && (
                                                <Col span={8}>
                                                    <Text className="text-gray-400 block">Duration</Text>
                                                    <Text className="text-white">{section.section_settings.duration} minutes</Text>
                                                </Col>
                                            )}
                                            {section.section_settings.passing_score && (
                                                <Col span={8}>
                                                    <Text className="text-gray-400 block">Passing Score</Text>
                                                    <Text className="text-white">{section.section_settings.passing_score}%</Text>
                                                </Col>
                                            )}
                                            {section.section_settings.break_duration && (
                                                <Col span={8}>
                                                    <Text className="text-gray-400 block">Break Duration</Text>
                                                    <Text className="text-white">{section.section_settings.break_duration} minutes</Text>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>
                                )}

                                {/* Proctoring Settings */}
                                {section.proctoring && (
                                    <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg">
                                        <Title level={5} className="!text-white !mb-3">
                                            <EyeOutlined className="mr-2" />
                                            Proctoring Settings
                                        </Title>
                                        <Row gutter={[8, 8]}>
                                            {Object.entries(section.proctoring).map(([key, value]) => (
                                                <Col span={8} key={key}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${value.enable ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <Text className="text-white capitalize">
                                                            {key.replace(/_/g, ' ')}
                                                        </Text>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}

                                {/* Questions */}
                                <div>
                                    <Title level={5} className="!text-white !mb-3">
                                        Questions
                                    </Title>
                                    {section.questions && Object.keys(section.questions).length > 0 ? (
                                        <Space direction="vertical" size="middle" className="w-full">
                                            {Object.entries(section.questions).map(([questionType, questions]) => {
                                                if (!Array.isArray(questions)) {
                                                    console.warn(`Questions for type ${questionType} is not an array:`, questions);
                                                    return null;
                                                }
                                                return questions.map((question, questionIndex) => (
                                                    <QuestionCard
                                                        key={question.question_id}
                                                        question={question}
                                                        questionNumber={questionIndex + 1}
                                                        questionType={questionType}
                                                    />
                                                ));
                                            })}
                                        </Space>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Text className="text-gray-400">No questions available for this section</Text>
                                        </div>
                                    )}
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                </Card>
            </div>
        </div>
    );
};

export default AssessmentDetail;
