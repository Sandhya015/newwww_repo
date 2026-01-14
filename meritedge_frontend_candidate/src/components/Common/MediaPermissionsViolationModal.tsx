import { Modal, Typography, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface MediaPermissionsViolationModalProps {
  readonly open: boolean;
  readonly violationType:
    | "permission"
    | "video_quality"
    | "microphone"
    | "fullscreen"
    | "tab_switch";
  readonly message: string;
  readonly onRetry?: () => void;
  // Fullscreen-specific props
  readonly violationCount?: number;
  readonly violationLimit?: number;
  readonly onEnterFullscreen?: () => void;
  readonly onClose?: () => void;
}

export default function MediaPermissionsViolationModal({
  open,
  violationType,
  message,
  onRetry,
  violationCount = 0,
  violationLimit = 5,
  onEnterFullscreen,
  onClose,
}: Readonly<MediaPermissionsViolationModalProps>) {
  const getTitle = () => {
    switch (violationType) {
      case "permission":
        return "Camera/Microphone Permission Required";
      case "video_quality":
        return "Video Quality Issue Detected";
      case "microphone":
        return "Microphone Access Required";
      case "fullscreen":
        return "Fullscreen Violation Detected!";
      case "tab_switch":
        return "Tab Switch Violation Detected!";
      default:
        return "Media Access Violation";
    }
  };

  const getInstructions = () => {
    switch (violationType) {
      case "permission":
        return [
          "• Grant camera and microphone permissions in your browser",
          "• Click on the lock icon in the address bar",
          "• Allow camera and microphone access",
          "• Refresh the page and try again",
        ];
      case "video_quality":
        return [
          "• Ensure your camera is not blocked or covered",
          "• Remove any objects in front of your camera lens",
          "• Check that your camera is working properly",
          "• Ensure there is adequate lighting",
          "• Try cleaning your camera lens if it's dirty",
        ];
      case "microphone":
        return [
          "• Grant microphone permission in your browser",
          "• Check that your microphone is not muted",
          "• Ensure your microphone is connected and working",
          "• Try selecting a different microphone in system settings",
        ];
      case "fullscreen":
        return [
          "• You must remain in fullscreen mode during the entire test",
          "• Your camera and screen are being recorded",
          "• All violations are being logged and monitored",
          "• Repeated violations will result in automatic test termination",
        ];
      case "tab_switch":
        return [
          "• You must remain on the assessment page during the entire test",
          "• Your camera and screen are being recorded",
          "• All violations are being logged and monitored",
          "• Repeated violations will result in automatic test termination",
        ];
      default:
        return [];
    }
  };

  const isFullscreenViolation =
    violationType === "fullscreen" || violationType === "tab_switch";
  const isTerminating =
    isFullscreenViolation && violationCount >= violationLimit;
  const canClose = isFullscreenViolation
    ? violationCount < violationLimit
    : false;

  const handleOk = () => {
    if (isFullscreenViolation && onEnterFullscreen) {
      onEnterFullscreen();
      if (onClose) {
        onClose();
      }
    } else if (onRetry) {
      onRetry();
    }
  };

  const handleCancel = () => {
    if (isFullscreenViolation && onEnterFullscreen) {
      onEnterFullscreen();
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <Modal
      open={open}
      closable={canClose}
      footer={
        isFullscreenViolation ? (
          <div className="flex justify-end gap-2">
            {!isTerminating && (
              <Button onClick={handleCancel} className="!rounded-lg">
                Close
              </Button>
            )}
            <Button
              type="primary"
              danger={isFullscreenViolation}
              onClick={handleOk}
              className={
                isFullscreenViolation
                  ? "!bg-red-600 !border-none hover:!bg-red-700 !rounded-lg"
                  : "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !rounded-lg"
              }
            >
              {isFullscreenViolation ? "Return to Fullscreen" : "Check Again"}
            </Button>
          </div>
        ) : onRetry ? (
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={handleOk}
              className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !rounded-lg"
            >
              Check Again
            </Button>
          </div>
        ) : null
      }
      centered
      width={600}
      maskClosable={false}
      keyboard={false}
      className="media-permissions-violation-modal"
      styles={{
        mask: {
          backgroundColor: "rgba(0, 0, 0, 0.95)",
        },
        content: {
          backgroundColor: isFullscreenViolation ? "#FFFFFF" : "#1D1D1F",
          border: isFullscreenViolation
            ? "1px solid #FF4D4F"
            : "1px solid #4C4C4C",
          borderRadius: "12px",
        },
      }}
      title={
        isFullscreenViolation ? (
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-red-500 text-2xl" />
            <span className="text-lg font-semibold text-red-600">
              Fullscreen Violation Detected!
            </span>
          </div>
        ) : undefined
      }
    >
      <div className={`py-4 ${isFullscreenViolation ? "" : "text-center"}`}>
        {!isFullscreenViolation && (
          <>
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF4D4F] bg-opacity-20 rounded-full">
                <ExclamationCircleOutlined className="text-3xl text-[#FF4D4F]" />
              </div>
            </div>

            {/* Title */}
            <Title level={3} className="!text-white !text-xl !mb-4">
              {getTitle()}
            </Title>
          </>
        )}

        {/* Message */}
        {isFullscreenViolation ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <pre className="text-red-800 whitespace-pre-wrap font-medium text-base">
              {message}
            </pre>
          </div>
        ) : (
          <Paragraph className="!text-[#CCCCCC] !text-base !mb-6 !leading-relaxed">
            {message}
          </Paragraph>
        )}

        {/* Instructions/Warning */}
        {isFullscreenViolation ? (
          <>
            {violationCount < violationLimit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Important:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  {getInstructions().map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {isTerminating && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">
                  ❌ Test Terminating
                </h4>
                <p className="text-sm text-red-800">
                  Your assessment is being terminated due to repeated fullscreen
                  violations. Your progress has been saved and recorded. You
                  will be redirected shortly.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Instructions */}
            <div className="bg-[#23242A] rounded-lg p-4 mb-4">
              <Paragraph className="!text-[#B0B0B0] !text-sm !mb-2">
                <strong>What to do next:</strong>
              </Paragraph>
              <ul className="text-left text-[#B0B0B0] text-sm space-y-1">
                {getInstructions().map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            {/* Warning Message */}
            <div className="bg-[#FF4D4F] bg-opacity-20 border-2 border-[#FF4D4F] rounded-lg p-4 mb-4">
              <Paragraph className="!text-[#FFE5E5] !text-sm !mb-0 !font-medium">
                <strong className="!text-[#FF6B6B]">⚠️ Important:</strong> You
                cannot proceed with the test until this issue is resolved. The
                test will not start until camera and microphone are properly
                configured.
              </Paragraph>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
