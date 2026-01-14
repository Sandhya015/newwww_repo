import { Modal, Tabs } from "antd";
import InviteCandidate from "../Cognitive/InviteCandidate";

interface InviteCandidateModalWrapperProps {
  open: boolean;
  onCancel: () => void;
  handleInviteCandidateOk: () => void;
  clearAllInviteCandidateSelection: () => void;
  selectedRowKeys: React.Key[];
  rowSelection: any;
  assessmentId: string;
  onCandidateAdded: (key: React.Key) => void;
  onCandidateRemoved: (key: React.Key) => void;
  resetCandidateList: boolean;
}

export default function InviteCandidateModalWrapper({
  open,
  onCancel,
  handleInviteCandidateOk,
  clearAllInviteCandidateSelection,
  selectedRowKeys,
  rowSelection,
  assessmentId,
  onCandidateAdded,
  onCandidateRemoved,
  resetCandidateList,
}: InviteCandidateModalWrapperProps) {
  return (
    <Modal
      className="!w-[95vw] sm:!w-[90vw] md:!w-[85vw] lg:!w-[1211px] !max-w-[1211px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg
                    [&_.ant-modal-close-x]:!text-[var(--text-primary)]"
      styles={{
        content: {
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
        },
        header: {
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border-primary)",
        },
        body: {
          color: "var(--text-primary)",
          backgroundColor: "var(--bg-primary)",
        },
      }}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: (
              <span className="flex items-center gap-2">
                <img
                  src={`${import.meta.env.BASE_URL}cognitive/user-plus.svg`}
                />
                Invite Candidate
              </span>
            ),
            children: (
              <InviteCandidate
                handleInviteCandidateOk={handleInviteCandidateOk}
                clearAllInviteCandidateSelection={
                  clearAllInviteCandidateSelection
                }
                selectedRowKeys={selectedRowKeys}
                rowSelection={rowSelection}
                assessmentId={assessmentId}
                onCandidateAdded={onCandidateAdded}
                onCandidateRemoved={onCandidateRemoved}
                resetCandidateList={resetCandidateList}
              />
            ),
          },
        ]}
        className={`
                        [&_.ant-tabs-nav]:!bg-[var(--bg-primary)]
                        [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                        [&_.ant-tabs-tab-btn]:!font-semibold
                        [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                        [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold
                        [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                        [&_.ant-tabs-ink-bar]:h-1.5
                        [&_.ant-tabs-nav]:border-b-0
                        [&_.ant-tabs-content-holder]:border-0
                        [&_.ant-tabs-content-holder]:!bg-[var(--bg-primary)]
                        text-lg
                    `}
        style={{ backgroundColor: "var(--bg-primary)" }}
      />
    </Modal>
  );
}

