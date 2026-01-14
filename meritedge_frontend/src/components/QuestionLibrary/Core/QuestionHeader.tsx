/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge, Button, Col, Divider, Row } from "antd";
import { Link, useNavigate } from "react-router-dom";

interface QuestionAddHeaderProps {
    currentAssessment?: any;
    sectionData?: any;
}

export default function QuestionAddHeader({ currentAssessment, sectionData }: QuestionAddHeaderProps) {
    const navigate = useNavigate();
    
    // Default values if no assessment data
    const title = sectionData?.data?.title || currentAssessment?.name || "Assessment";
    const difficultyLevel = sectionData?.data?.difficulty_level || currentAssessment?.difficulty_level || "Intermediate";
    const experience = sectionData?.data?.target_experience || currentAssessment?.target_experience || "Not specified";
    const skills = sectionData?.data?.skills_required || currentAssessment?.skills_required || ["No skills specified"];
    const assessment_status = sectionData?.data?.status || currentAssessment?.status || "Not specified";

    // Check if there are questions based on sectionData
    const totalQuestionCount = sectionData?.data?.question_count ? parseInt(sectionData.data.question_count, 10) : 0;
    const hasQuestions = totalQuestionCount > 0;
    
    // Additional data from sectionData
    const totalSections = sectionData?.data?.section_count ? parseInt(sectionData.data.section_count, 10) : 0;
    const totalScore = sectionData?.data?.total_score || "0";
    const targetRole = sectionData?.data?.target_role || "Not specified";

    const handleBackClick = () => {
        navigate('/cognitive');
    };

    return (
        <Row align="middle" justify="space-between">
            <Col>
                <Row>
                    <Col className="mr-3">
                        <img 
                            src={`${import.meta.env.BASE_URL}question-library/arrow-circle-left.svg`} 
                            onClick={handleBackClick}
                            style={{ cursor: 'pointer' }}
                            alt="Back to Cognitive"
                        />
                    </Col>
                    <Col className="!grid !gap-4">
                        <div style={{ fontFamily: "Helvetica_Neue-Medium, Helvetica", fontWeight: "500", color: "var(--text-primary)", fontSize: "20px", }}>
                            {title} <Button className="!bg-[#e5c30a36] !text-[#F9A216] !font-semibold !border-none"><Badge status="warning" /> {assessment_status}</Button>
                        </div>
                        <span style={{ fontFamily: "Helvetica_Neue-Regular, Helvetica", fontWeight: "400", color: "var(--text-secondary)", fontSize: "12px" }} >
                            Role: {targetRole} <Divider type="vertical" className="bg-[#8c8c8c]" /> Experience: {experience} <Divider type="vertical" className="bg-[#8c8c8c]" /> Skills: {skills.join(", ")}
                        </span>
                    </Col>
                </Row>
            </Col>

            <Col>
                <Row className="mt-5 lg:0 xl:mt-0 2xl:mt-0" align="middle" style={{ backgroundColor: "#00000070", borderRadius: "254.23px", border: "1px solid #ffffff3d", padding: "14px 30px", gap: "30.15px", }}>
                    <Col>
                        <Row align="middle" gutter={10}>
                            <Col>
                                <img src={`${import.meta.env.BASE_URL}question-library/seal-question.svg`} />
                            </Col>
                            <Col>
                                                        <p style={{ color: "var(--text-primary)", margin: 0 }}>
                            Total Questions: <span style={{ fontWeight: "500" }}>{totalQuestionCount}</span>
                        </p>
                            </Col>
                        </Row>
                    </Col>

                    <Divider type="vertical" style={{ height: "24px", backgroundColor: "#ffffff3d" }} />

                    <Col>
                        <Row align="middle" gutter={10}>
                            <Col>
                                <img src={`${import.meta.env.BASE_URL}question-library/list-dashes.svg`} />
                            </Col>
                            <Col>
                                <p style={{ color: "var(--text-primary)", margin: 0 }}>
                                    Total Sections: <span style={{ fontWeight: "500" }}>{totalSections}</span>
                                </p>
                            </Col>
                        </Row>
                    </Col>

                </Row>
            </Col>

            <Col>
                <Row align="middle" gutter={10}>
                    <Col>
                        <img src={`${import.meta.env.BASE_URL}question-library/check-circle.svg`} />
                    </Col>
                    <Col>
                        <div style={{ fontFamily: "Helvetica_Neue-Medium, Helvetica", fontWeight: "500", color: "var(--text-primary)", fontSize: "14px" }}>
                            Choose Questions
                        </div>
                    </Col>
                    <Col>
                        <img src={`${import.meta.env.BASE_URL}layout/caret-down.svg`} />
                    </Col>
                    <Col>
                        {hasQuestions ? (
                            <Link 
                                to={'/question-setting'} 
                                style={{ 
                                    fontFamily: "Helvetica_Neue-Medium, Helvetica", 
                                    fontWeight: "500", 
                                    color: "#52c41a", 
                                    fontSize: "16px",
                                    cursor: "pointer"
                                }}
                            >
                                Next
                            </Link>
                        ) : (
                            <span 
                                style={{ 
                                    fontFamily: "Helvetica_Neue-Medium, Helvetica", 
                                    fontWeight: "500", 
                                    color: "#8c8c8c", 
                                    fontSize: "16px",
                                    cursor: "not-allowed"
                                }}
                                title="Add at least one question to proceed"
                            >
                                Next
                            </span>
                        )}
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
