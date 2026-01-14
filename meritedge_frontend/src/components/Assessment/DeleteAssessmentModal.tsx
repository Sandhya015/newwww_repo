import { Button, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { TestDataType } from "./types";

interface DeleteAssessmentModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  assessmentToDelete: TestDataType | null;
  loading: boolean;
}

export default function DeleteAssessmentModal({
  open,
  onCancel,
  onConfirm,
  assessmentToDelete,
  loading,
}: DeleteAssessmentModalProps) {
  return (
    <Modal
      className="!w-[90vw] sm:!w-[500px] !max-w-[500px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
      title={<span className="text-base sm:text-lg">Delete Assessment</span>}
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
          key="delete"
          danger
          type="primary"
          size="small"
          loading={loading}
          onClick={onConfirm}
          className="!bg-[#ff4d4f] !border-[#ff4d4f] hover:!bg-[#ff7875] !text-xs sm:!text-sm"
        >
          {loading ? "Deleting..." : "Delete"}
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
      <div className="text-center py-3 sm:py-4">
        <div className="mb-3 sm:mb-4">
          <DeleteOutlined
            style={{
              fontSize: window.innerWidth < 640 ? "36px" : "48px",
              color: "#ff4d4f",
            }}
          />
        </div>
        <h3
          className="text-base sm:text-lg font-semibold mb-2 sm:mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Are you sure you want to delete this assessment?
        </h3>
        {assessmentToDelete && (
          <p
            className="mb-3 sm:mb-4 text-sm sm:text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            <strong>"{assessmentToDelete.name}"</strong>
          </p>
        )}
        <p className="text-[#ff4d4f] text-xs sm:text-sm">
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
}

