import { Modal, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface MissingCandidateModalProps {
    readonly open: boolean;
}

export default function MissingCandidateModal({ open }: Readonly<MissingCandidateModalProps>) {
    return (
        <Modal
            open={open}
            closable={false}
            footer={null}
            centered
            width={500}
            maskClosable={false}
            keyboard={false}
            className="missing-candidate-modal"
            styles={{
                mask: {
                    backgroundColor: "rgba(0, 0, 0, 0.95)",
                },
                content: {
                    backgroundColor: "#1D1D1F",
                    border: "1px solid #4C4C4C",
                    borderRadius: "12px",
                },
            }}
        >
            <div className="text-center py-6">
                {/* Icon */}
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF4D4F] bg-opacity-20 rounded-full">
                        <ExclamationCircleOutlined className="text-3xl text-[#FF4D4F]" />
                    </div>
                </div>

                {/* Title */}
                <Title level={3} className="!text-white !text-xl !mb-4">
                    Access Denied - Cannot Load Assessment
                </Title>

                {/* Message */}
                <Paragraph className="!text-[#CCCCCC] !text-base !mb-6 !leading-relaxed">
                    Unable to access this assessment. This may be due to a missing or invalid candidate ID, expired authentication token, or an authentication error. You cannot proceed without proper authorization.
                </Paragraph>

                {/* Additional Info */}
                <div className="bg-[#23242A] rounded-lg p-4 mb-4">
                    <Paragraph className="!text-[#B0B0B0] !text-sm !mb-2">
                        <strong>What to do next:</strong>
                    </Paragraph>
                    <ul className="text-left text-[#B0B0B0] text-sm space-y-1">
                        <li>• Check your email for the correct assessment link</li>
                        <li>• Ensure you're using the most recent link provided</li>
                        <li>• Contact your recruiter or assessment coordinator for a new link</li>
                        <li>• Verify that your assessment link hasn't expired</li>
                        <li>• Do not attempt to access this page directly without a valid link</li>
                    </ul>
                </div>

                {/* Warning Message */}
                <div className="bg-[#FF4D4F] bg-opacity-20 border-2 border-[#FF4D4F] rounded-lg p-4">
                    <Paragraph className="!text-[#FFE5E5] !text-sm !mb-0 !font-medium">
                        <strong className="!text-[#FF6B6B]">⚠️ Important:</strong> This assessment cannot be accessed without valid authorization. Please request a new assessment link from your coordinator if this issue persists.
                    </Paragraph>
                </div>
            </div>
        </Modal>
    );
}
