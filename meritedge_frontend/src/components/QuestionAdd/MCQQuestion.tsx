import { useState } from "react";
import { Button, Card, Col, Modal, Row, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import DOMPurify from 'dompurify';

const { Title, Paragraph, Text } = Typography

// Helper function to decode HTML entities and strip outer tags if needed
const decodeHTMLEntities = (text: string) => {
    if (!text) return '';
    
    // First decode any HTML entities
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    const decoded = textArea.value;
    
    console.log('MCQ Original text:', text);
    console.log('MCQ Decoded text:', decoded);
    
    return decoded;
};

export default function MCQQuestion({ MCQQuestions, onDeleteQuestion }) {
    console.log('MCQQuestion component received props:', { MCQQuestions, onDeleteQuestion });
    console.log('onDeleteQuestion type:', typeof onDeleteQuestion);
    console.log('onDeleteQuestion is function:', typeof onDeleteQuestion === 'function');
    
    const [selectedMCQQuestionId, setSelectedMCQQuestionId] = useState<number | null>(null);
    const [isMCQQuestionModalOpen, setIsMCQQuestionModalOpen] = useState(false);

    const openMCQQuestionModal = (index) => {
        setSelectedMCQQuestionId(index)
        setIsMCQQuestionModalOpen(true);
    };

    const handleMCQQuestionOk = () => {
        setIsMCQQuestionModalOpen(false);
    };

    const handleIMCQQuestionCancel = () => {
        setIsMCQQuestionModalOpen(false);
    };

    return (
        <>
            {MCQQuestions?.map((item, index) => (
                <div key={index}>
                    <div className="group !relative !w-full !rounded-[8px] !overflow-hidden !mt-3">
                        <div className="!opacity-0 group-hover:!opacity-100 !transition-opacity !absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_5s_linear_infinite] !rounded-full" style={{ background: "conic-gradient(from 360deg at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 41%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 60%)", transformOrigin: "center" }} />

                        <Card
                            className="!rounded-[8px] !flex !items-center !justify-start h-auto !rounded-[8px] overflow-hidden !m-[2px]"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-primary)',
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
                                            {item.tag || "React"}
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
                                                    onDeleteQuestion(MCQQuestions[index].question_id);
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
                                        onClick={() => openMCQQuestionModal(index)}
                                    >
                                        More details
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {selectedMCQQuestionId === index && (
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
                                        <div className="px-3 py-3 bg-[#0D65EA] rounded-xl">
                                            <img src={`${import.meta.env.BASE_URL}question-add/multiple.svg`} />
                                        </div>
                                    </Col>

                                    <Col>
                                        <Title level={4} className="!mt-2" style={{ color: 'var(--text-primary)' }}>Multiple Choice Question</Title>
                                    </Col>
                                </Row>
                            }
                            open={isMCQQuestionModalOpen}
                            onCancel={handleIMCQQuestionCancel}
                            footer={null}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "30px",
                                    position: "relative",
                                }}
                            >
                                <div style={{ width: "100%" }}>
                                    <Card className="!border-none !rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <Row justify="space-between" align="middle">
                                            <Col>
                                                <Row align="middle" gutter={8}>
                                                    <Col>
                                                        <div
                                                            style={{
                                                                width: 6,
                                                                height: 34,
                                                                backgroundColor:
                                                                    "#7C3AED",
                                                                borderRadius: "0 100px 100px 0",
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col>
                                                        <Title level={4} style={{ color: "var(--text-primary)", margin: 0 }}>
                                                            Java Script Array Method
                                                        </Title>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            <Col>
                                                <Row gutter={16} align="middle">
                                                    <Col style={{ display: "flex", alignItems: "center", borderRadius: "8px" }}
                                                        className="!gap-2 !border !border-[#5D729C6B] !bg-[#26272D] !px-3 !py-1 w-auto h-auto">
                                                        <img src={`${import.meta.env.BASE_URL}question-library/tag.svg`} alt="tag" />
                                                        <span style={{ color: 'var(--text-secondary)' }}>React Js</span>
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
                                            What is the primary function of the garbage collector in Java, and
                                            how does it handle objects that are no longer reachable through
                                            reference chains?
                                        </Text>
                                    </Paragraph>

                                    <div>
                                        <Title level={5} style={{ color: "var(--text-secondary)" }}>
                                            Choose the correct answer
                                        </Title>
                                        <Card
                                            style={{
                                                backgroundColor: "var(--bg-secondary)",
                                                borderRadius: 10,
                                                borderColor: "var(--border-primary)",
                                            }}
                                        >
                                            <Paragraph style={{ color: "var(--text-primary)" }}>
                                                <p style={{ color: "var(--text-primary)" }}>
                                                    A. The garbage collector in Java automatically frees up memory
                                                    by removing objects that are no longer reachable through
                                                    reference chains.
                                                </p>

                                                <p className="text-[#C4B5FD]">
                                                    B. It keeps track of all objects in memory and prevents them
                                                    from being deleted until the program ends.
                                                </p>

                                                <p style={{ color: "var(--text-primary)" }}>
                                                    C. The garbage collector only removes objects that are
                                                    explicitly marked for deletion by the programmer.
                                                </p>

                                                <p style={{ color: "var(--text-primary)" }}>
                                                    D. It periodically checks for objects that are still in use and
                                                    optimizes memory allocation accordingly.
                                                </p>
                                            </Paragraph>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                    )}
                </div>
            ))}
        </>
    )
}
