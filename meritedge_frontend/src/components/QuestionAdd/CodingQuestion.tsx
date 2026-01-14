import { useState } from "react";
import { Button, Card, Col, Divider, Modal, Row, Tag, Typography } from "antd";
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, CodeOutlined, DeleteOutlined, FieldTimeOutlined, MenuOutlined, UserOutlined, } from "@ant-design/icons";
import DOMPurify from 'dompurify';

const { Title, Text, Paragraph } = Typography;

// Helper function to decode HTML entities and strip outer tags if needed
const decodeHTMLEntities = (text: string) => {
    if (!text) return '';
    
    // First decode any HTML entities
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    const decoded = textArea.value;
    
    console.log('Coding Original text:', text);
    console.log('Coding Decoded text:', decoded);
    
    return decoded;
};

export default function CodingQuestion({ codingQuestions, onDeleteQuestion }) {
    console.log('CodingQuestion component received props:', { codingQuestions, onDeleteQuestion });
    console.log('onDeleteQuestion type:', typeof onDeleteQuestion);
    console.log('onDeleteQuestion is function:', typeof onDeleteQuestion === 'function');

    const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<number | null>(null);
    const [isCodingQuestionModalOpen, setIsCodingQuestionModalOpen] = useState(false);

    const openCodingQuestionModal = (index) => {
        setSelectedCodingQuestionId(index)
        setIsCodingQuestionModalOpen(true);
    };

    const handleCodingQuestionCancel = () => {
        setIsCodingQuestionModalOpen(false);
    };

    return (
        <>
            {codingQuestions?.map((item, index) => (
                <>
                    <div className="group !relative !w-full !rounded-[8px] !overflow-hidden !mt-3">
                        <div className="!opacity-0 group-hover:!opacity-100 !transition-opacity !absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_5s_linear_infinite] !rounded-full" style={{ background: "conic-gradient(from 360deg at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 41%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 60%)", transformOrigin: "center" }} />
                        <Card
                            key={index}
                            className="h-auto !rounded-[8px] overflow-hidden !m-[2px] overflow-hidden"
                            style={{
                                backgroundColor: "var(--bg-tertiary)",
                                border: "1px solid var(--border-primary)",
                                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.1)",
                                backdropFilter: "blur(25px) brightness(100%)",
                                WebkitBackdropFilter: "blur(25px) brightness(100%)"
                            }}
                        >
                            <div
                                className="absolute opacity-0 group-hover:opacity-[0.2] transition-opacity duration-350"
                                style={{
                                    zIndex: 1,
                                    width: "370.393px",
                                    height: "424px",
                                    top: "-20%",
                                    left: "55%",
                                    backgroundColor: "#7C3AED",
                                    borderRadius: "424px",
                                    transform: "rotate(-30.137deg)",
                                    filter: "blur(105px)",
                                }}
                            />

                            {/* Purple bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "0",
                                    top: "24px",
                                    width: "6px",
                                    height: "34px",
                                    backgroundColor: "#7C3AED",
                                    borderRadius: "0px 100px 100px 0px"
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
                                                        decodeHTMLEntities(item.title || "Untitled Question")
                                                    )
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
                                            {item.tag || "JavaScript"}
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
                                                        color: "#BFBFBF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    Created at {item.createdAt || "Unknown"}
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
                                                        color: "#BFBFBF",
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
                                                        color: "#BFBFBF",
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
                                                        color: "#BFBFBF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    L{item.difficulty_level || item.difficultyLevel || "?"}
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
                                                        color: "#BFBFBF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    {item.time_limit || item.duration || "2"} min
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
                                                color: "#A78BFA",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle like
                                            }}
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                        </Button>
                                            {/* Delete Icon */}
                                            <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                    if (onDeleteQuestion) {
                                                        onDeleteQuestion(codingQuestions[index].question_id);
                                                    }
                                                }} 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 bg-[#FEE2E2] hover:bg-[#FECACA] rounded-full"
                                                title="Delete question"
                                            >
                                                <DeleteOutlined style={{ fontSize: "16px", color: "#DC2626" }} />
                                            </div>
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
                                    >
                                        {item.description}
                                    </p>
                                </div>

                                {/* More Details Link */}
                                <div>
                                    <span
                                        className="!text-[#C4B5FD] !font-normal cursor-pointer hover:!text-[#A78BFA]"
                                        style={{
                                            fontSize: "14px",
                                            fontFamily: "Helvetica_Neue-Regular, Helvetica",
                                        }}
                                        onClick={() => openCodingQuestionModal(index)}
                                    >
                                        More details
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {selectedCodingQuestionId === index && (
                        <Modal
                            className="!w-[1211px] 
                                [&_.ant-modal-content]:!bg-[var(--bg-primary)]
                                [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-content]:!rounded-xl
                                [&_.ant-modal-header]:!bg-[var(--bg-primary)]
                                [&_.ant-modal-title]:!text-[var(--text-primary)]
                                [&_.ant-modal-body]:!text-[var(--text-primary)]
                                [&_.ant-modal-close]:!text-[var(--text-primary)]
                                [&_.ant-modal-close]:!top-5 [&_.ant-modal-close]:!right-5
                                [&_.ant-modal-close-x]:!text-lg"
                            title={
                                <Row justify="start" align="middle" style={{ marginBottom: "30px" }} gutter={10}>
                                    <Col>
                                        <div className="px-3 py-3 bg-[#EA0000] rounded-xl">
                                            <img src={`${import.meta.env.BASE_URL}question-add/coding.svg`} className="w-5" />
                                        </div>
                                    </Col>

                                    <Col>
                                        <Title level={4} className="!mt-2" style={{ color: "var(--text-primary)" }}>Coding Question</Title>
                                    </Col>
                                </Row>
                            }
                            open={isCodingQuestionModalOpen}
                            onCancel={handleCodingQuestionCancel}
                            footer={null}
                        >
                            <div style={{ width: "100%" }}>
                                <Card className="!border-none !rounded-xl" style={{ backgroundColor: "var(--bg-secondary)" }}>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Row align="middle" gutter={8}>
                                                <Col>
                                                    <div
                                                        style={{
                                                            width: 6,
                                                            height: 34,
                                                            backgroundColor: "#7C3AED",
                                                            borderRadius: "0 100px 100px 0",
                                                        }}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Title level={4} style={{ color: "var(--text-primary)", margin: 0 }}>
                                                        Memory Efficient Data Aggregation
                                                    </Title>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col>
                                            <Row gutter={16} align="middle">
                                                <Col 
                                                    className="!gap-2 !border !px-3 !py-1 w-auto h-auto"
                                                    style={{ display: "flex", alignItems: "center", borderRadius: "8px", borderColor: "var(--border-primary)", backgroundColor: "var(--bg-tertiary)" }}>
                                                    <img src={`${import.meta.env.BASE_URL}question-library/tag.svg`} alt="tag" />
                                                    <span style={{ color: "var(--text-secondary)" }}>Python</span>
                                                </Col>
                                                <Col style={{ display: "flex", alignItems: "center" }}>
                                                    <img src={`${import.meta.env.BASE_URL}question-library/calendar-dots.svg`} alt="calendar" />
                                                    <span style={{ color: "var(--text-primary)", marginLeft: "8px" }}>Created at 11/12/2023</span>
                                                </Col>

                                                <Col style={{ display: "flex", alignItems: "center" }}>
                                                    <img src={`${import.meta.env.BASE_URL}question-library/file-dashed.svg`} alt="uses" />
                                                    <span style={{ color: "var(--text-primary)", marginLeft: "8px" }}>567 Uses</span>
                                                </Col>

                                                <Col style={{ display: "flex", alignItems: "center" }}>
                                                    <img src={`${import.meta.env.BASE_URL}question-library/mask-happy.svg`} alt="pass rate" />
                                                    <span style={{ color: "var(--text-primary)", marginLeft: "8px" }}>80% Avg. Pass Rate</span>
                                                </Col>

                                                <Col style={{ display: "flex", alignItems: "center" }}>
                                                    <img src={`${import.meta.env.BASE_URL}question-library/clock.svg`} alt="duration" />
                                                    <span style={{ color: "var(--text-primary)", marginLeft: "8px" }}>{item.time_limit || item.duration || "2"} min</span>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Card>

                                <Paragraph className="!mt-4">
                                    <Text strong style={{ color: "var(--text-primary)" }}>Q.</Text>
                                    <Text strong style={{ color: "var(--text-primary)" }}>
                                        {" "}
                                        You are tasked with designing a Python program to efficiently
                                        process a large dataset of customer transactions stored in a CSV
                                        file. Each row contains the customer&#39;s ID, timestamp, product
                                        ID, and transaction amount. What key programming strategies should
                                        be considered to ensure efficient memory usage, avoid data
                                        duplication, and maintain scalability for future data
                                        integrations?
                                    </Text>
                                </Paragraph>

                                <Row>
                                    <Col span={24}>
                                        <Title level={5} style={{ color: "var(--text-secondary)" }}>
                                            Input Format:
                                        </Title>
                                        <Paragraph style={{ color: "var(--text-primary)" }}>
                                            The first line contains an integer n (1 ≤ n ≤ 10^6) — the number of
                                            transactions.
                                            <br /> Each of the next n lines contains a string ID, timestamp,
                                            product ID, and float amount.
                                        </Paragraph>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col span={24}>
                                        <Title level={5} style={{ color: "var(--text-secondary)" }}>
                                            Output Format:
                                        </Title>
                                        <Paragraph style={{ color: "var(--text-primary)" }}>
                                            Print the total sum of all transaction amounts for customers who
                                            made more than one purchase.
                                        </Paragraph>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col span={24}>
                                        <Title level={5} style={{ color: "var(--text-primary)" }}>
                                            Test Cases
                                        </Title>
                                        <Card
                                            className="!mb-3"
                                            style={{
                                                backgroundColor: "var(--bg-secondary)",
                                                borderRadius: "10px",
                                                borderColor: "var(--border-primary)",
                                            }}
                                        >
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Card
                                                        bordered={false}
                                                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
                                                    >
                                                        <Title level={5} style={{ color: "var(--text-primary)" }}>
                                                            Input
                                                        </Title>
                                                        <Paragraph style={{ color: "var(--text-primary)" }}>
                                                            C123 2024-07-01T09:00 P01 99.99
                                                        </Paragraph>
                                                    </Card>
                                                </Col>
                                                <Col span={12}>
                                                    <Card
                                                        bordered={false}
                                                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
                                                    >
                                                        <Title level={5} style={{ color: "var(--text-primary)" }}>
                                                            Output
                                                        </Title>
                                                        <Paragraph style={{ color: "var(--text-primary)" }}>&quot;3&quot;</Paragraph>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </Card>

                                        <Card
                                            style={{
                                                backgroundColor: "var(--bg-secondary)",
                                                borderRadius: "10px",
                                                borderColor: "var(--border-primary)",
                                            }}
                                        >
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Card
                                                        bordered={false}
                                                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
                                                    >
                                                        <Title level={5} style={{ color: "var(--text-primary)" }}>
                                                            Input
                                                        </Title>
                                                        <Paragraph style={{ color: "var(--text-primary)" }}>
                                                            C456 2024-07-01T09:30 P02 49.50
                                                        </Paragraph>
                                                    </Card>
                                                </Col>
                                                <Col span={12}>
                                                    <Card
                                                        bordered={false}
                                                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
                                                    >
                                                        <Title level={5} style={{ color: "var(--text-primary)" }}>
                                                            Output
                                                        </Title>
                                                        <Paragraph style={{ color: "var(--text-primary)" }}>
                                                            &quot;219.99&quot;
                                                        </Paragraph>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Modal>
                    )}
                </>
            ))}
        </>
    )
}
