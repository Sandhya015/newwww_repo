import { Modal, Button, Typography, Space } from "antd";
import {
  FullscreenOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface FullscreenModalProps {
  open: boolean;
  onEnterFullscreen: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  isSupported: boolean;
  canSkip?: boolean;
  secureMode?: boolean;
}

export default function FullscreenModal({
  open,
  onEnterFullscreen,
  onSkip,
  onClose,
  isSupported,
  canSkip = true,
  secureMode = false,
}: FullscreenModalProps) {
  // Fallback close function in case parent handlers don't work
  const handleFallbackClose = () => {
    console.log("Fallback close called in FullscreenModal");
    if (onClose) {
      onClose();
    }
  };
  return (
    <Modal
      open={open}
      closable={!!onClose}
      onCancel={onClose}
      footer={null}
      centered
      width={700}
      className="fullscreen-modal"
      styles={{
        mask: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5843EE] bg-opacity-20 rounded-full">
            <FullscreenOutlined className="text-3xl text-[#5843EE]" />
          </div>
        </div>

        {/* Title */}
        <Title level={3} className="!text-white !text-xl !mb-4">
          {isSupported
            ? secureMode
              ? "Secure Assessment - Enter Fullscreen"
              : "Enter Fullscreen Mode"
            : "Fullscreen Not Supported"}
        </Title>

        {/* Message */}
        <Paragraph className="!text-[#CCCCCC] !text-base !mb-6 !leading-relaxed">
          {isSupported ? (
            secureMode ? (
              <>
                <strong className="text-[#FFA500]">
                  SECURE ASSESSMENT MODE ACTIVE
                </strong>
                <br />
                <br />
                To maintain assessment integrity and security, you must enter
                fullscreen mode. This secure testing environment prevents
                unauthorized access and ensures fair assessment conditions.
              </>
            ) : (
              <>
                For the best testing experience and to maintain assessment
                integrity, we recommend entering fullscreen mode. This helps
                prevent distractions and ensures a secure testing environment.
              </>
            )
          ) : (
            <>
              Your browser doesn't support fullscreen mode. You can still
              proceed with the test, but we recommend closing other applications
              and tabs for a focused testing experience.
            </>
          )}
        </Paragraph>

        {/* Warning */}
        <div className="bg-[#23242A] rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExclamationCircleOutlined className="text-[#FFA500] text-lg mt-0.5" />
            <div className="text-left">
              <Paragraph className="!text-[#FFA500] !text-sm !mb-1 !font-semibold">
                Important:
              </Paragraph>
              <ul className="text-[#B0B0B0] text-sm space-y-1">
                <li>• Do not switch tabs or minimize the browser</li>
                <li>• Close all other applications</li>
                <li>• Ensure a stable internet connection</li>
                <li>• Do not use external devices or notes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Debug Close Button */}
        {/* <div className="mb-4">
          <Button
            type="text"
            onClick={handleFallbackClose}
            className="!text-red-400 hover:!bg-red-900/20 !rounded-lg !px-4 !py-2"
            size="small"
          >
            DEBUG: Force Close Modal
          </Button>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {isSupported ? (
            <Button
              type="primary"
              onClick={() => {
                console.log("Enter Fullscreen button clicked in modal");
                onEnterFullscreen();
                // Modal will close automatically when fullscreen is confirmed
              }}
              icon={<FullscreenOutlined />}
              className="!bg-[#5843EE] !border-none !rounded-lg lg:!px-12 !py-3 !h-auto !font-semibold hover:!bg-[#6B52F0]"
              size="large"
            >
              Enter Fullscreen
            </Button>
          ) : (
            <Button
              onClick={onSkip}
              className="!bg-[#4C4C4C] !border-none !rounded-lg lg:!px-12 !py-3 !h-auto !font-semibold hover:!bg-[#666666] !text-white"
              size="large"
            >
              Continue
            </Button>
          )}

          {/* Skip button - only show if skipping is allowed, fullscreen is supported, and not in secure mode */}
          {isSupported && canSkip && onSkip && !secureMode && (
            <Button
              onClick={() => {
                console.log(
                  "Continue without Fullscreen button clicked in modal"
                );
                if (onSkip) {
                  onSkip();
                }
              }}
              className="!bg-[#4C4C4C] !border-none !rounded-lg !px-8 !py-3 !h-auto !font-semibold hover:!bg-[#666666] !text-white"
              size="large"
            >
              Continue without Fullscreen
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
