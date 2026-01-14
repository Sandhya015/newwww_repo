/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge, Button, Col, Divider, Row, Modal, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateAssessmentTitle } from "../../lib/api";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

interface QuestionAddHeaderProps {
  currentAssessment?: any;
  sectionData?: any;
  onAssessmentUpdate?: () => void;
}

export default function QuestionAddHeader({
  currentAssessment,
  sectionData,
  onAssessmentUpdate,
}: QuestionAddHeaderProps) {
  const navigate = useNavigate();
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [titleError, setTitleError] = useState("");

  // Default values if no assessment data
  const title =
    sectionData?.data?.title || currentAssessment?.name || "Assessment";
  const experience =
    sectionData?.data?.target_experience ||
    currentAssessment?.target_experience ||
    "Not specified";
  const skills = sectionData?.data?.skills_required ||
    currentAssessment?.skills_required || ["No skills specified"];
  const assessment_status =
    sectionData?.data?.status || currentAssessment?.status || "Not specified";

  // Check if assessment is in draft mode
  const isDraft = assessment_status?.toLowerCase() === "draft";

  // Get assessment ID
  const assessmentId =
    currentAssessment?.key ||
    currentAssessment?.unique_id ||
    sectionData?.data?.unique_id;

  // Check if there are questions based on sectionData
  const totalQuestionCount = sectionData?.data?.question_count
    ? parseInt(sectionData.data.question_count, 10)
    : 0;
  const hasQuestions = totalQuestionCount > 0;

  // Calculate section count with fallback to ensure consistency
  const getSectionCount = () => {
    const serverCount = sectionData?.data?.section_count
      ? parseInt(sectionData.data.section_count, 10)
      : 0;
    const actualCount = sectionData?.data?.sections?.length || 0;
    // Use the higher of the two counts to ensure consistency
    return Math.max(serverCount, actualCount);
  };

  const totalSections = getSectionCount();
  const targetRole = sectionData?.data?.target_role || "Not specified";

  const handleBackClick = () => {
    navigate("/cognitive");
  };

  const handleEditTitleClick = () => {
    setEditTitle(title);
    setTitleError("");
    setIsEditTitleModalOpen(true);
  };

  const handleUpdateTitle = async () => {
    if (!editTitle.trim()) {
      setTitleError("Assessment name cannot be empty");
      // showErrorToast("Assessment name cannot be empty");
      return;
    }

    setTitleError("");

    if (!assessmentId) {
      showErrorToast("Assessment ID not found");
      return;
    }

    setIsUpdatingTitle(true);
    try {
      const response = await updateAssessmentTitle(
        assessmentId,
        editTitle.trim()
      );

      if (response?.success) {
        showSuccessToast("Assessment title updated successfully");
        setIsEditTitleModalOpen(false);
        setEditTitle("");
        setTitleError("");

        // Refresh assessment data
        if (onAssessmentUpdate) {
          onAssessmentUpdate();
        }
      } else {
        const errorMessage =
          response?.data?.message ||
          response?.data ||
          "Failed to update assessment title";
        showErrorToast(errorMessage);
      }
    } catch (error) {
      console.error("Error updating assessment title:", error);
      showErrorToast("An error occurred while updating the assessment title");
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditTitleModalOpen(false);
    setEditTitle("");
    setTitleError("");
  };

  return (
    <Row
      align="middle"
      justify="space-between"
      className="flex-col lg:flex-row gap-3 sm:gap-4"
    >
      <Col xs={24} lg={8} xl={10}>
        <Row className="items-start sm:items-center">
          <Col className="mr-2 sm:mr-3">
            <img
              src={`${
                import.meta.env.BASE_URL
              }question-library/arrow-circle-left.svg`}
              onClick={handleBackClick}
              className="w-6 sm:w-8 cursor-pointer"
              alt="Back to Cognitive"
            />
          </Col>
          <Col className="!grid !gap-2 sm:!gap-3 md:!gap-4 flex-1">
            <div
              className="flex flex-wrap items-center gap-2 text-base sm:!text-lg md:!text-xl"
              style={{
                fontFamily: "Helvetica_Neue-Medium, Helvetica",
                fontWeight: "500",
                color: "var(--text-primary)",
              }}
            >
              <span className="truncate max-w-[200px] sm:max-w-none">
                {title}
              </span>
              {isDraft && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={handleEditTitleClick}
                  className="!text-[var(--text-primary)] hover:!text-[#7C3AED]"
                  style={{
                    minWidth: "auto",
                    height: "32px",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Edit assessment name"
                />
              )}
              <Button
                size="small"
                className="!bg-[#e5c30a36] !text-[#F9A216] !font-semibold !border-none !text-xs sm:!text-sm"
              >
                <Badge status="warning" /> {assessment_status}
              </Button>
            </div>
            <span
              className="text-[11px] sm:text-xs block truncate"
              style={{
                fontFamily: "Helvetica_Neue-Regular, Helvetica",
                fontWeight: "400",
                color: "var(--text-secondary)",
              }}
            >
              Role: {targetRole}{" "}
              <Divider
                type="vertical"
                className="bg-[#8c8c8c] hidden sm:inline-block"
              />{" "}
              Experience: {experience}{" "}
              <Divider
                type="vertical"
                className="bg-[#8c8c8c] hidden md:inline-block"
              />{" "}
              <span className="hidden md:inline">
                Skills: {skills.join(", ")}
              </span>
            </span>
          </Col>
        </Row>
      </Col>

      <Col xs={24} sm={12} lg={8} xl={8}>
        <Row
          className="mt-3 lg:mt-0 rounded-full border border-[#ffffff3d] px-5 py-2.5 gap-[15px] sm:!px-[25px] sm:!py-[12px] sm:gap-[20px] md:!px-[30px] md:!py-[14px] md:gap-[10px]"
          align="middle"
        >
          <Col flex="none">
            <div className="flex items-center gap-2">
              <img
                src={`${
                  import.meta.env.BASE_URL
                }question-library/seal-question.svg`}
                className="w-4 sm:w-5 flex-shrink-0"
                alt="Questions"
              />
              <p className="text-xs sm:text-sm whitespace-nowrap text-[var(--text-primary)] !m-0">
                Total Questions:{" "}
                <span className="font-semibold">{totalQuestionCount}</span>
              </p>
            </div>
          </Col>

          <Divider type="vertical" className="!h-5 sm:!h-6 bg-[#ffffff3d]" />

          <Col flex="none">
            <div className="flex items-center gap-2">
              <img
                src={`${
                  import.meta.env.BASE_URL
                }question-library/list-dashes.svg`}
                className="w-4 sm:w-5 flex-shrink-0"
                alt="Sections"
              />
              <p className="text-xs sm:text-sm whitespace-nowrap text-[var(--text-primary)] !m-0">
                Total Sections:{" "}
                <span className="font-semibold">{totalSections}</span>
              </p>
            </div>
          </Col>
        </Row>
      </Col>

      <Col xs={24} sm={12} lg={6} xl={5}>
        <Row
          align="middle"
          gutter={[8, 0]}
          className="justify-start lg:justify-start mt-3 lg:mt-0"
        >
          <Col>
            <img
              src={`${
                import.meta.env.BASE_URL
              }question-library/check-circle.svg`}
              className="w-4 sm:w-5"
            />
          </Col>
          <Col>
            <div
              className="text-xs sm:text-sm"
              style={{
                fontFamily: "Helvetica_Neue-Medium, Helvetica",
                fontWeight: "500",
                color: "var(--text-primary)",
              }}
            >
              Choose Questions
            </div>
          </Col>
          <Col>
            <img
              src={`${import.meta.env.BASE_URL}layout/caret-down.svg`}
              className="w-3 sm:w-4"
            />
          </Col>
          <Col>
            {hasQuestions ? (
              <Link
                to={"/question-setting"}
                className="text-sm sm:text-base"
                style={{
                  fontFamily: "Helvetica_Neue-Medium, Helvetica",
                  fontWeight: "500",
                  color: "#52c41a",
                  cursor: "pointer",
                }}
              >
                Next
              </Link>
            ) : (
              <span
                className="text-sm sm:text-base"
                style={{
                  fontFamily: "Helvetica_Neue-Medium, Helvetica",
                  fontWeight: "500",
                  color: "#8c8c8c",
                  cursor: "not-allowed",
                }}
                title="Add at least one question to proceed"
              >
                Next
              </span>
            )}
          </Col>
        </Row>
      </Col>

      {/* Edit Assessment Title Modal */}
      <Modal
        title="Edit Assessment Name"
        open={isEditTitleModalOpen}
        onOk={handleUpdateTitle}
        onCancel={handleCancelEditTitle}
        okText="Update"
        cancelButtonProps={{ style: { display: "none" } }}
        confirmLoading={isUpdatingTitle}
        className="[&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-close]:!text-[var(--text-primary)] [&_.ant-btn-primary]:!bg-[var(--accent-primary)] [&_.ant-btn-primary]:!border-[var(--accent-primary)] [&_.ant-btn-default]:!text-[var(--text-primary)] [&_.ant-btn-default]:!border-[var(--border-primary)]"
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
            borderBottom: "1px solid var(--border-primary)",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Assessment Name
            </label>
            <Input
              placeholder="Enter assessment name"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (titleError) {
                  setTitleError("");
                }
              }}
              onPressEnter={handleUpdateTitle}
              className="!h-10 !pl-5 !rounded-xl"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                borderColor: titleError ? "#ff4d4f" : "var(--border-primary)",
              }}
              autoFocus
            />
            {titleError && (
              <div className="text-xs mt-1" style={{ color: "#ff4d4f" }}>
                {titleError}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Row>
  );
}
