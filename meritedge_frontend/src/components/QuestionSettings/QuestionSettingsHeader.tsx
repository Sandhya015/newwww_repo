import { Badge, Button, Col, Divider, Row } from "antd";
import { Link } from "react-router-dom";

interface QuestionSettingsHeaderProps {
  currentAssessment: Record<string, unknown> | null;
  totalDuration?: string;
}

export default function QuestionSettingsHeader({ currentAssessment, totalDuration = "00:00:00" }: QuestionSettingsHeaderProps) {
    
    return (
        <Row align="middle" justify="space-between">
            <Col>
                <Row>
                    <Col className="mr-3">
                        <Link to="/question-add">
                            <img src={`${import.meta.env.BASE_URL}question-library/arrow-circle-left.svg`} />
                        </Link>
                    </Col>
                    <Col className="!grid !gap-4">
                        <div style={{ fontFamily: "Helvetica_Neue-Medium, Helvetica", fontWeight: "500", color: "var(--text-primary)", fontSize: "20px", }}>
                            {String(currentAssessment?.name || 'Assessment Title')} <Button className="!bg-[#e5c30a36] !text-[#F9A216] !font-semibold !border-none"><Badge status="warning" /> {String(currentAssessment?.status || 'Unpublished')}</Button>
                        </div>
                        <span style={{ fontFamily: "Helvetica_Neue-Regular, Helvetica", fontWeight: "400", color: "var(--text-secondary)", fontSize: "12px" }} >
                            Test Code: {String(currentAssessment?.testCode || 'N/A')} <Divider type="vertical" style={{ backgroundColor: 'var(--text-secondary)' }} /> Created: {String(currentAssessment?.created || 'N/A')}
                        </span>
                    </Col>
                </Row>
            </Col>

            <Col>
                <Row align="middle" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "254.23px", border: "1px solid var(--border-primary)", padding: "14px 30px", gap: "30.15px", }}>
                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                                src={`${import.meta.env.BASE_URL}question-library/seal-question.svg`} 
                                style={{ filter: 'var(--icon-filter)', width: '18px', height: '18px' }}
                                alt="Questions"
                            />
                            <p style={{ color: "var(--text-primary)", margin: 0, fontSize: '14px' }}>
                                Total Questions: <span style={{ fontWeight: "500" }}>{Number(currentAssessment?.questions || 0)}</span>
                            </p>
                        </div>
                    </Col>

                    <Divider type="vertical" style={{ height: "24px", backgroundColor: "var(--border-primary)" }} />

                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                                src={`${import.meta.env.BASE_URL}question-library/timer.svg`} 
                                style={{ filter: 'var(--icon-filter)', width: '18px', height: '18px' }}
                                alt="Timer"
                            />
                            <p style={{ color: "var(--text-primary)", margin: 0, fontSize: '14px' }}>
                                Total Duration:{" "}
                                <span style={{ fontWeight: "500" }}>{totalDuration}</span>
                            </p>
                        </div>
                    </Col>
                </Row>
            </Col>

            <Col>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src={`${import.meta.env.BASE_URL}question-library/check-circle.svg`} 
                        style={{ filter: 'var(--icon-filter)', width: '16px', height: '16px' }}
                        alt="Completed"
                    />
                    <Link 
                        to={'/question-add'} 
                        style={{ 
                            fontFamily: "Helvetica_Neue-Medium, Helvetica", 
                            fontWeight: "500", 
                            color: "var(--text-primary)", 
                            fontSize: "14px",
                            textDecoration: 'none'
                        }}
                    >
                        Choose Questions
                    </Link>

                    <img 
                        src={`${import.meta.env.BASE_URL}layout/caret-down.svg`} 
                        style={{ filter: 'var(--icon-filter)', width: '12px', height: '12px' }}
                        alt="Arrow"
                    />

                    <div style={{ 
                        fontFamily: "Helvetica_Neue-Medium, Helvetica", 
                        fontWeight: "500", 
                        color: "var(--text-primary)", 
                        fontSize: "14px" 
                    }}>
                        Settings
                    </div>
                </div>
            </Col>
        </Row>
    )
}
