import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeftToLine } from "lucide-react";
import {
  Col,
  Input,
  Layout,
  Modal,
  Row,
  Switch,
  Typography,
  Upload,
} from "antd";
import { DownOutlined, FileTextFilled } from "@ant-design/icons";
import { useDispatch } from "react-redux";

const { Title, Paragraph, Text } = Typography;
const { Sider } = Layout;

// Components
import LeftSideBarMenu from "./LeftSideBarMenu";

// Context
import { UserContext } from "../../context/User/UserContext";

// Sidebar Context
import { useSidebar } from "../../context/SidebarContext";

// Store
import { logoutUser } from "../../store/miscSlice";
import { performLogout } from "../../utils/logout";

export default function LeftSideBar() {
  // Context
  const userContext = useContext(UserContext);

  // Redux dispatch
  const dispatch = useDispatch();

  // Side Bar Context
  const { toggleSidebar, isSideBarOpen } = useSidebar();

  const navigate = useNavigate();

  const location = useLocation();

  // Logout
  const handleLogout = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    // Use comprehensive logout utility (this also dismisses all toasts)
    performLogout();

    // Update UserContext
    userContext?.setAccessToken(null);

    // Navigate to home
    navigate("/");

    // Show Logout Message
    toast.success("Logout successfully.");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateCognitiveTestOk = () => {
    setIsModalOpen(false);
  };

  const handleCreateCognitiveTestCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Sider
        trigger={null}
        collapsible
        collapsed={!isSideBarOpen}
        className={`h-full m-1 sm:m-2 md:m-4 lg:m-9 px-1 sm:px-2 md:px-3 lg:px-4 pt-2 sm:pt-3 md:pt-4 lg:pt-5 pb-4 sm:pb-6 md:pb-8 lg:pb-10 flex flex-col justify-between rounded-[8px] sm:rounded-[12px] md:rounded-[16px] lg:rounded-[20px] transition-all duration-300`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
        }}
        width={210}
        collapsedWidth={80}
        breakpoint="lg"
      >
        <div className="flex flex-col h-full justify-between">
          {/* Top Section */}
          <div>
            <div
              className="flex !flex-row items-center px-2 mb-0 cursor-pointer gap-4"
              onClick={toggleSidebar}
            >
              <span
                className={`font-helvetica-neue text-xs sm:text-sm font-normal leading-normal transition-all duration-300 ${
                  isSideBarOpen ? "" : "rotate-180"
                }`}
                style={{ color: "var(--sidebar-text)" }}
              >
                <ArrowLeftToLine />
              </span>

              {isSideBarOpen && (
                <span
                  className="text-sm font-medium text-white"
                  style={{ color: "var(--sidebar-text)" }}
                >
                  Menu
                </span>
              )}
            </div>

            <div className="flex justify-start mt-3 sm:mt-4 md:mt-5">
              <span
                className="w-full h-[1.5px] rounded"
                style={{ backgroundColor: "var(--sidebar-divider)" }}
              ></span>
            </div>

            <nav className="flex flex-col gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 md:mt-5 overflow-y-auto flex-1 max-h-[calc(100vh-200px)]">
              <LeftSideBarMenu
                route={`/dashboard`}
                title={"Dashboard"}
                image_src={`layout/dashboard.svg`}
              />

              <LeftSideBarMenu
                route={`/cognitive`}
                title={"Cognitive"}
                image_src={`layout/cognitive.svg`}
              />

              <LeftSideBarMenu
                route={`/question-library`}
                title={"Question Library"}
                image_src={`layout/users.svg`}
              />
              {/* <LeftSideBarMenu
                route={`/candidates`}
                title={"Candidates"}
                image_src={`layout/users.svg`}
              /> */}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mt-auto">
            {/* Settings Link - navigates to /settings route which shows sidebar + form */}
            <LeftSideBarMenu
              route="/settings"
              title="Settings"
              activeRoutes={[
                "/settings",
                "/update-profile",
                "/change-password",
                "/verify-email-change",
              ]}
            />

            <LeftSideBarMenu route="/profile" title="Profile" avatar={true} />

            <LeftSideBarMenu
              title="Logout"
              isButton={true}
              onClick={handleLogout}
            />
          </div>
        </div>
      </Sider>

      <Modal
        className="!w-[682px]"
        title={
          <Row justify="center" align="middle" style={{ marginBottom: "30px" }}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Title level={4}>Create Cognitive Test</Title>
              <Paragraph className="!text-gray-500 !font-medium">
                Upload a job description or manually enter test details. You can
                also let AI generate the test for you.
              </Paragraph>
            </Col>
          </Row>
        }
        open={isModalOpen}
        onCancel={handleCreateCognitiveTestCancel}
        footer={null}
      >
        <Row style={{ marginBottom: "30px" }}>
          <Col span={24}>
            <Text strong>Job Description </Text>
            <Text type="secondary">(Optional)</Text>
            <Upload.Dragger
              name="file"
              multiple={false}
              className="flex flex-col justify-center items-center gap-[10px] p-[40px_30px] self-stretch custom-dragger-border"
            >
              <p className="ant-upload-drag-icon">
                <FileTextFilled
                  className="!text-[#8C8C8C]"
                  style={{ fontSize: "24px" }}
                />
              </p>
              <p className="ant-upload-text">Upload JD (PDF or Text)</p>
              <p className="ant-upload-hint">
                Supported Formats: doc, docx, rtf, pdf, up to 2MB
              </p>
            </Upload.Dragger>
          </Col>
        </Row>

        <Row style={{ marginBottom: "30px" }}>
          <Col span={24}>
            <Text strong>Skills</Text>
            <Input
              className="h-10 !pl-5"
              placeholder="Enter required skills"
              style={{ borderRadius: "20px", marginTop: "10px" }}
            />
          </Col>
        </Row>

        <Row style={{ marginBottom: "30px" }}>
          <Col span={24}>
            <Text strong>Experience</Text>
            <Input
              className="h-10 !pl-5"
              placeholder="Select years of experience"
              suffix={<DownOutlined />}
              style={{ borderRadius: "20px", marginTop: "10px" }}
            />
          </Col>
        </Row>

        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "30px" }}
        >
          <Col>
            <Text strong>Auto Create Test Using AI</Text>
          </Col>
          <Col>
            <Switch />
          </Col>
        </Row>

        <button
          className="flex justify-center bg-[#780DEA] rounded-full py-3 w-full !text-white font-semibold cursor-pointer"
          onClick={handleCreateCognitiveTestOk}
        >
          Create Test
        </button>
      </Modal>
    </>
  );
}
