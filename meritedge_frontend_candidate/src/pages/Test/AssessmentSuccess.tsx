import React, { useEffect } from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  Space,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { maskWithLength } from "../../utils/maskUtils";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function AssessmentSuccess() {
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );
  const candidateId = useSelector((state: any) => state.misc?.candidate_id);

  // Stop all media tracks when component mounts (safety measure)
  useEffect(() => {
    // Stop all active media tracks as a safety measure
    console.log("🛑 AssessmentSuccess: Stopping any remaining media tracks...");
    
    try {
      // Stop all tracks from any stored streams
      if (typeof window !== 'undefined') {
        const storedStreams = (window as any).__activeMediaStreams || [];
        storedStreams.forEach((stream: MediaStream) => {
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              track.stop();
              console.log("🛑 Stopped track on mount:", track.kind, track.label);
            }
          });
        });
      }
      
      // Exit fullscreen if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Ignore errors
        });
      }
    } catch (e) {
      console.warn("Error stopping tracks on mount:", e);
    }
  }, []);

  // Prevent back navigation
  useEffect(() => {
    // Disable back button
    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    // Push a new state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    // Disable browser back button with keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" && e.target === document.body) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handleBackButton);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Get completion time (you can modify this based on your timer implementation)
  const completionTime = new Date().toLocaleString();

  return (
    <Layout className="!bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
      {/* Video Background */}
      <video
        className="absolute top-0 left-0 w-screen h-screen object-cover z-0 brightness-19 [object-position:60%_190%]"
        autoPlay
        muted
        loop
      >
        <source
          src={`${import.meta.env.BASE_URL}test/getty-images.mp4`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      <Content className="relative z-10 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <Card
            className="!bg-[#1D1D1F] !border-[#23263C] !rounded-2xl shadow-2xl"
            bodyStyle={{ padding: "48px" }}
          >
            {/* Success Header */}
            <div className="text-center mb-8">
              <CheckCircleOutlined
                className="text-6xl text-green-500 mb-4"
                style={{ fontSize: "80px" }}
              />
              <Title level={1} className="!text-white !mb-4 !text-4xl">
                Assessment Completed Successfully!
              </Title>
              <Paragraph className="!text-gray-300 !text-lg !mb-0">
                Congratulations! You have successfully completed your
                assessment.
              </Paragraph>
            </div>

            <Divider className="!bg-[#23263C] !my-8" />

            {/* Assessment Details */}
            <Row gutter={[24, 24]} className="mb-8">
              <Col xs={24} md={12}>
                <Card
                  className="!bg-[#2a2a2a] !border-[#333] h-full"
                  bodyStyle={{ padding: "24px" }}
                >
                  <Space direction="vertical" size="large" className="w-full">
                    <div className="flex items-center gap-3">
                      <UserOutlined className="text-blue-500 text-xl" />
                      <div>
                        <Text className="!text-gray-400 text-sm">
                          Candidate ID
                        </Text>
                        <div className="!text-white font-medium">
                          {maskWithLength(candidateId)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <TrophyOutlined className="text-yellow-500 text-xl" />
                      <div>
                        <Text className="!text-gray-400 text-sm">
                          Assessment Name
                        </Text>
                        <div className="!text-white font-medium">
                          {assessmentSummary?.assessment_name || "Assessment"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ClockCircleOutlined className="text-green-500 text-xl" />
                      <div>
                        <Text className="!text-gray-400 text-sm">
                          Completed At
                        </Text>
                        <div className="!text-white font-medium">
                          {completionTime}
                        </div>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  className="!bg-[#2a2a2a] !border-[#333] h-full"
                  bodyStyle={{ padding: "24px" }}
                >
                  <Title level={4} className="!text-white !mb-4">
                    Assessment Summary
                  </Title>
                  <Space direction="vertical" size="middle" className="w-full">
                    <div className="flex justify-between">
                      <Text className="!text-gray-400">Total Questions</Text>
                      <Text className="!text-white font-medium">
                        {assessmentSummary?.assessment_overview
                          ?.total_questions || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="!text-gray-400">Duration</Text>
                      <Text className="!text-white font-medium">
                        {assessmentSummary?.assessment_overview
                          ?.total_duration_minutes || "N/A"}{" "}
                        minutes
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="!text-gray-400">Status</Text>
                      <Text className="!text-green-500 font-medium">
                        ✅ Completed
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider className="!bg-[#23263C] !my-8" />

            {/* Next Steps */}
            <div className="text-center">
              <Title level={3} className="!text-white !mb-4">
                What's Next?
              </Title>
              <Paragraph className="!text-gray-300 !text-base !mb-6">
                Your assessment has been submitted successfully. Our team will
                review your responses and you will be contacted with the results
                shortly.
              </Paragraph>

              <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#333]">
                <Title level={4} className="!text-white !mb-3">
                  Important Information
                </Title>
                <ul className="text-left !text-gray-300 space-y-2">
                  <li>• Your assessment responses have been securely saved</li>
                  <li>
                    • You will receive an email notification when results are
                    ready
                  </li>
                  <li>
                    • Please keep this page bookmarked for future reference
                  </li>
                </ul>
              </div>

              {/* Close Button */}
              <div className="mt-8">
                <Button
                  size="large"
                  className="!bg-blue-600 !border-blue-600 !text-white hover:!bg-blue-700 hover:!border-blue-700 !px-8 !py-3 !h-auto !font-medium"
                  onClick={() => {
                    // Stop all media tracks and recordings before closing
                    console.log("🛑 Closing assessment - stopping all recordings...");
                    
                    // Stop all active media tracks from any source
                    try {
                      const allTracks: MediaStreamTrack[] = [];
                      
                      // Check for any active streams stored globally
                      if (typeof window !== 'undefined') {
                        // Try to access any stored streams
                        const storedStreams = (window as any).__activeMediaStreams || [];
                        storedStreams.forEach((stream: MediaStream) => {
                          stream.getTracks().forEach(track => {
                            if (track.readyState === 'live') {
                              allTracks.push(track);
                            }
                          });
                        });
                      }
                      
                      // Stop all found tracks
                      allTracks.forEach(track => {
                        try {
                          track.stop();
                          console.log("🛑 Stopped track:", track.kind, track.label);
                        } catch (e) {
                          console.warn("Could not stop track:", e);
                        }
                      });
                      
                      if (allTracks.length > 0) {
                        console.log(`✅ Stopped ${allTracks.length} active media tracks`);
                      }
                    } catch (e) {
                      console.error("Error stopping tracks:", e);
                    }
                    
                    // Exit fullscreen if still active
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {
                        // Ignore errors
                      });
                    }
                    
                    // Close the current tab/window
                    window.close();
                    
                    // If window.close() doesn't work (some browsers block it), show a message
                    setTimeout(() => {
                      alert("You can now safely close this tab. All recordings have been stopped.");
                    }, 100);
                  }}
                >
                  Close Assessment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
