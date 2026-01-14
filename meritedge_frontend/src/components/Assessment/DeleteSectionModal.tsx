import { Button, Modal } from "antd";
import { DeleteOutlined, WarningOutlined } from "@ant-design/icons";

interface SectionToDelete {
  section_id: string;
  section_name: string;
  question_count?: number | string;
  total_score?: number | string;
}

interface DeleteSectionModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  sectionToDelete: SectionToDelete | null;
  loading: boolean;
}

export default function DeleteSectionModal({
  open,
  onCancel,
  onConfirm,
  sectionToDelete,
  loading,
}: DeleteSectionModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <WarningOutlined className="!text-red-500" />
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            Delete Section
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <div key="footer" className="flex items-center gap-4 justify-end mt-3">
          <Button
            key="cancel"
            onClick={onCancel}
            className="!bg-transparent hover:!bg-gray-100 !text-[var(--text-secondary)] !border-[var(--border-primary)]"
          >
            Cancel
          </Button>

          <Button
            key="delete"
            type="primary"
            danger
            loading={loading}
            onClick={onConfirm}
            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
          >
            {loading ? "Deleting..." : "Delete Section"}
          </Button>
        </div>,
      ]}
      className="!w-[90vw] sm:!w-[500px] !max-w-[500px]
                    [&_.ant-modal-content]:!border-2 [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
      styles={{
        content: {
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
          border: "2px solid var(--border-primary)",
          borderRadius: "12px",
        },
        header: {
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-primary)",
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
          backgroundColor: "var(--bg-primary)",
          borderTop: "1px solid var(--border-primary)",
          borderRadius: "0 0 12px 12px",
        },
      }}
      width={500}
    >
      <div className="py-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <DeleteOutlined className="!text-red-500" />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Are you sure you want to delete this section?
            </h3>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              This action cannot be undone. The section and all its questions
              will be permanently removed from the assessment.
            </p>
            {sectionToDelete && (
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-primary)",
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Section Name:
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sectionToDelete.section_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Questions:
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sectionToDelete.question_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Total Score:
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sectionToDelete.total_score || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Section ID:
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {sectionToDelete.section_id}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
