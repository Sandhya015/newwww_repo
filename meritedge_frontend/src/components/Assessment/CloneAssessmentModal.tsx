import { Button, Input, Modal } from "antd";
import type { InputRef } from "antd";
import { useRef } from "react";
import { TestDataType } from "./types";

interface CloneAssessmentModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  assessmentToClone: TestDataType | null;
  loading: boolean;
  cloneTitle: string;
  onCloneTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CloneAssessmentModal({
  open,
  onCancel,
  onConfirm,
  assessmentToClone,
  loading,
  cloneTitle,
  onCloneTitleChange,
}: CloneAssessmentModalProps) {
  const cloneTitleInputRef = useRef<InputRef>(null);

  return (
    <Modal
      className="!w-[90vw] sm:!w-[500px] !max-w-[500px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
      title={<span className="text-base sm:text-lg">Clone Assessment</span>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          size="small"
          className="!bg-[#222223] !border !border-[#222223] hover:!text-[#ffffff] !text-xs sm:!text-sm"
        >
          Cancel
        </Button>,
        <Button
          key="clone"
          type="primary"
          size="small"
          loading={loading}
          onClick={onConfirm}
          className="!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6D28D9] !text-xs sm:!text-sm"
        >
          {loading ? "Cloning..." : "Clone"}
        </Button>,
      ]}
      styles={{
        content: {
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
          border: "1px solid #F8F7F9",
          borderRadius: "12px",
        },
        header: {
          backgroundColor: "var(--bg-primary)",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
        },
        body: {
          color: "var(--text-primary)",
        },
        mask: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        },
        footer: {
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
        },
      }}
    >
      <div className="py-2 sm:py-4">
        <p
          className="text-sm sm:text-base mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Create a copy of this assessment with a new title
        </p>

        {assessmentToClone && (
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Parent Assessment Title
            </label>
            <Input
              value={assessmentToClone.name}
              className="!h-11 !rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                borderColor: "var(--border-primary)",
              }}
              disabled
              readOnly
            />
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            New Assessment Title
          </label>
          <Input
            ref={cloneTitleInputRef}
            placeholder="Enter assessment title"
            value={cloneTitle}
            onChange={onCloneTitleChange}
            onPressEnter={onConfirm}
            className="!h-11 !rounded-lg"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-primary)",
            }}
            disabled={loading}
            autoFocus
            allowClear
          />
        </div>
      </div>
    </Modal>
  );
}

