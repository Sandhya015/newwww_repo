/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Form, Modal, Spin, Avatar } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  TeamOutlined,
  PlusOutlined,
  SafetyOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { CustomInput } from "../../components/ui/CustomInput";
import CustomSelect from "../../components/ui/CustomSelect";
import {
  useGetUserHierarchy,
  useGetUserPermissions,
  useGetSubUsers,
  useCreateSubUser,
  type CreateSubUserPayload,
  type HierarchyUser,
} from "../../api/Profile/UserProfileAPI";
import { selectUser } from "../../store/miscSlice";

export default function Profile() {
  const user = useSelector(selectUser);
  const [form] = Form.useForm();

  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateSubUserModalOpen, setIsCreateSubUserModalOpen] =
    useState(false);

  // API Hooks
  const {
    getUserHierarchy,
    data: hierarchyData,
    isLoading: hierarchyLoading,
  } = useGetUserHierarchy();
  const {
    getUserPermissions,
    data: permissionsData,
    isLoading: permissionsLoading,
  } = useGetUserPermissions();
  const { getSubUsers, data: subUsersData, isLoading: subUsersLoading } =
    useGetSubUsers();
  const { createSubUser, isLoading: createSubUserLoading } =
    useCreateSubUser();

  // Load data on mount
  useEffect(() => {
    getUserHierarchy();
    getUserPermissions();
    if (user?.unique_id) {
      getSubUsers(user.unique_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.unique_id]);

  // Handle create sub-user
  const handleCreateSubUser = async (values: any) => {
    const payload: CreateSubUserPayload = {
      email: values.email,
      full_name: values.full_name,
      role: values.role || "user",
      designation: values.designation,
      phone: values.phone,
      country_code: values.country_code || "+91",
      password: values.password,
      permissions: [],
      feature_flags: {},
      notification_settings: {},
      interviewer_tags: [],
      assessment_templates: [],
    };

    const result = await createSubUser(payload);
    if (result) {
      setIsCreateSubUserModalOpen(false);
      form.resetFields();
      
      // Refresh all data to show new sub-user immediately
      console.log("✅ Sub-user created! Refreshing all data...");
      
      // Refresh hierarchy to show new user
      await getUserHierarchy();
      
      // Refresh sub-users list
      if (user?.unique_id) {
        await getSubUsers(user.unique_id);
      }
      
      // Refresh permissions to update counts
      await getUserPermissions();
      
      console.log("🎉 All data refreshed!");
    }
  };

  // Render hierarchy tree recursively
  const renderHierarchyTree = (node: HierarchyUser, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        key={node.user_id}
        className="mb-4"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderLeft: `2px solid ${level === 0 ? "var(--accent-primary)" : "var(--border-secondary)"}`,
          }}
        >
          <Avatar
            size={level === 0 ? 48 : 40}
            style={{
              backgroundColor: "var(--accent-primary)",
              fontSize: level === 0 ? "20px" : "16px",
            }}
          >
            {node.full_name.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex-1">
            <h4
              className={`${level === 0 ? "text-lg font-semibold" : "text-base font-medium"} mb-1`}
              style={{ color: "var(--text-primary)" }}
            >
              {node.full_name}
            </h4>
            <div className="flex gap-4 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                {node.designation}
              </span>
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              >
                Level {node.hierarchy_level}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && (
          <div className="mt-2">
            {node.children.map((child) => renderHierarchyTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="p-4 md:p-6 lg:p-8 min-h-screen overflow-y-auto" 
      style={{ 
        color: "var(--text-primary)",
        backgroundColor: "var(--bg-primary)",
        position: "relative",
        zIndex: 1
      }}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Profile
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage your profile and team members
        </p>
      </div>

      {/* Row 1: Profile Information + Team Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profile Information Card */}
        <div
          className="rounded-xl p-6 shadow-sm h-full"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          <div className="flex justify-between items-start mb-6">
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Profile Information
              </h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <EditOutlined style={{ color: "#ffffff", fontSize: "18px" }} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <Avatar
              size={120}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "var(--accent-primary)",
                fontSize: "48px",
              }}
            />
            <h3
              className="text-2xl font-bold mt-4"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.full_name || "User Name"}
            </h3>
            <span
              className="px-3 py-1 rounded-full mt-2"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              {user?.role || "User"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <MailOutlined
                  style={{ color: "var(--accent-primary)", fontSize: "20px" }}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Email
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.email || "N/A"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <PhoneOutlined
                  style={{ color: "var(--accent-primary)", fontSize: "20px" }}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Contact
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.phone || "N/A"}
                </p>
              </div>
            </div>

            {/* Designation */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <UserOutlined
                  style={{ color: "var(--accent-primary)", fontSize: "20px" }}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Designation
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.designation || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Hierarchy Card */}
        <div
          className="rounded-xl p-6 shadow-sm h-full flex flex-col"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <ApartmentOutlined
              style={{ color: "var(--accent-primary)", fontSize: "24px" }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Team Hierarchy
            </h2>
          </div>

          {hierarchyLoading ? (
            <div className="flex justify-center py-8 flex-1">
              <Spin />
            </div>
          ) : hierarchyData?.hierarchy ? (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
              {renderHierarchyTree(hierarchyData.hierarchy)}
            </div>
          ) : (
            <p style={{ color: "var(--text-tertiary)" }}>
              No hierarchy data available
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Permissions + Sub-users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permissions Card */}
        <div
          className="rounded-xl p-6 shadow-sm h-full flex flex-col"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <SafetyOutlined
              style={{ color: "var(--accent-primary)", fontSize: "24px" }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Permissions
            </h2>
          </div>

          {permissionsLoading ? (
            <div className="flex justify-center py-8 flex-1">
              <Spin />
            </div>
          ) : permissionsData ? (
            <div className="space-y-4 flex-1">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Current Hierarchy
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Level {permissionsData.current_hierarchy}
                </p>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <p
                  className="text-sm mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Sub-users
                </p>
                <div className="flex justify-between items-center">
                  <span
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {permissionsData.current_sub_users} /{" "}
                    {permissionsData.max_sub_users}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: "var(--accent-primary)",
                      color: "#ffffff",
                    }}
                  >
                    {permissionsData.remaining_slots} slots left
                  </span>
                </div>
              </div>

              {permissionsData.can_create && (
                <button
                  onClick={() => setIsCreateSubUserModalOpen(true)}
                  className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-auto"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                  }}
                >
                  <PlusOutlined />
                  Add Sub-user
                </button>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--text-tertiary)" }}>
              No permissions data available
            </p>
          )}
        </div>

        {/* Sub-users Card */}
        <div
          className="rounded-xl p-6 shadow-sm h-full flex flex-col"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TeamOutlined
                style={{ color: "var(--accent-primary)", fontSize: "24px" }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Sub-users
              </h2>
              {subUsersData && (
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {subUsersData.count}
                </span>
              )}
            </div>
          </div>

          {subUsersLoading ? (
            <div className="flex justify-center py-8 flex-1">
              <Spin />
            </div>
          ) : subUsersData?.sub_users && subUsersData.sub_users.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
              {subUsersData.sub_users.map((subUser) => (
                <div
                  key={subUser.unique_id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:shadow-sm transition-all"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <Avatar
                    size={56}
                    style={{
                      backgroundColor: "var(--accent-primary)",
                      fontSize: "20px",
                    }}
                  >
                    {subUser.full_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div className="flex-1">
                    <h4
                      className="font-semibold text-base mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {subUser.full_name}
                    </h4>
                    <p
                      className="text-sm mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {subUser.email}
                    </p>
                    <div className="flex gap-2 items-center">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {subUser.designation}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            subUser.status === "active"
                              ? "#10b981"
                              : "#6b7280",
                          color: "#ffffff",
                        }}
                      >
                        {subUser.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs mb-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Level
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {subUser.hierarchy_level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TeamOutlined
                style={{
                  fontSize: "64px",
                  color: "var(--text-tertiary)",
                  marginBottom: "16px",
                }}
              />
              <p
                className="text-lg mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                No sub-users yet
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Add your first sub-user to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        title={
          <span style={{ color: "var(--text-primary)" }}>Edit Profile</span>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={600}
        style={{ top: 20 }}
        zIndex={1000}
      >
        <div
          className="p-4"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          }}
        >
          <p
            className="text-center text-lg mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Profile editing feature coming soon!
          </p>
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            You'll be able to update your name, photo, contact details, and more.
          </p>
        </div>
      </Modal>

      {/* Create Sub-user Modal */}
      <Modal
        title={
          <span style={{ color: "var(--text-primary)" }}>
            Create New Sub-user
          </span>
        }
        open={isCreateSubUserModalOpen}
        onCancel={() => {
          setIsCreateSubUserModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        style={{ top: 20 }}
        zIndex={1000}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  Full Name <span style={{ color: "#ff4d4f" }}></span>
                </span>
              }
              name="full_name"
              rules={[
                { required: true, message: "Please enter full name" },
                { min: 2, message: "Name must be at least 2 characters" },
                { max: 100, message: "Name cannot exceed 100 characters" },
                {
                  pattern: /^[a-zA-Z\s]+$/,
                  message: "Name can only contain letters and spaces",
                },
              ]}
            >
              <CustomInput placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  Email <span style={{ color: "#ff4d4f" }}></span>
                </span>
              }
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email address" },
                {
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email format",
                },
              ]}
            >
              <CustomInput placeholder="Enter email" type="email" />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  Designation <span style={{ color: "#ff4d4f" }}></span>
                </span>
              }
              name="designation"
              rules={[
                { required: true, message: "Please enter designation" },
                { min: 2, message: "Designation must be at least 2 characters" },
                { max: 50, message: "Designation cannot exceed 50 characters" },
              ]}
            >
              <CustomInput placeholder="Enter designation" />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  Phone <span style={{ color: "#ff4d4f" }}></span>
                </span>
              }
              name="phone"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid phone number",
                },
              ]}
            >
              <CustomInput placeholder="Enter 10-digit phone number" type="tel" />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  <span style={{ color: "#ff4d4f" }}>*</span>Country Code
                </span>
              }
              name="country_code"
              initialValue="+91"
            >
              <CustomSelect
                prefix={null}
                placeholder="Select country code"
                options={[
                  { label: "+91 (India)", value: "+91" },
                  { label: "+1 (US/Canada)", value: "+1" },
                  { label: "+44 (UK)", value: "+44" },
                  { label: "+61 (Australia)", value: "+61" },
                  { label: "+65 (Singapore)", value: "+65" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "var(--text-primary)" }}>
                  Password <span style={{ color: "#ff4d4f" }}></span>
                </span>
              }
              name="password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 8, message: "Password must be at least 8 characters" },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message:
                    "Password must contain uppercase, lowercase, number and special character",
                },
              ]}
              extra={
                <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                  Min 8 characters with uppercase, lowercase, number & special character
                </span>
              }
            >
              <CustomInput placeholder="Enter password" type="password" />
            </Form.Item>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => {
                setIsCreateSubUserModalOpen(false);
                form.resetFields();
              }}
              className="px-6 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubUserLoading}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
              }}
            >
              {createSubUserLoading ? <Spin size="small" /> : <PlusOutlined />}
              Create Sub-user
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

