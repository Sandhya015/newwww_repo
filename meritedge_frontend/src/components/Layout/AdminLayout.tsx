import React from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { selectAdminUser } from "../../store/adminSlice";
import { performAdminLogout } from "../../utils/logout";

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  const navigate = useNavigate();
  const adminUser = useSelector(selectAdminUser);

  const handleLogout = () => {
    // Perform admin logout
    performAdminLogout();

    // Redirect to admin login
    navigate("/admin/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/admin/dashboard"),
    },
    {
      key: "organizations",
      icon: <BankOutlined />,
      label: "Organizations",
      onClick: () => navigate("/admin/organizations"),
    },
    {
      key: "companies",
      icon: <BankOutlined />,
      label: "Companies",
      onClick: () => navigate("/admin/companies"),
    },
    {
      key: "company-users",
      icon: <UserOutlined />,
      label: "Company Users",
      onClick: () => navigate("/admin/company-users"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "System Settings",
      onClick: () => navigate("/admin/settings"),
    },
  ];

  return (
    <Layout
      style={{ minHeight: "100vh", backgroundColor: "var(--admin-content-bg)" }}
    >
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={60}
        breakpoint="lg"
        style={{
          backgroundColor: "var(--admin-sidebar-bg)",
          borderRight: "1px solid var(--admin-sidebar-border)",
        }}
      >
        <div
          className="p-3 sm:p-4"
          style={{ borderBottom: "1px solid var(--admin-sidebar-border)" }}
        >
          <img
            src={`${import.meta.env.BASE_URL}common/otomeyt-ai-logo.svg`}
            alt="Otomeyt AI Logo"
            className={`h-6 sm:h-8 w-auto transition-all duration-200 ${
              collapsed ? "mx-auto" : ""
            }`}
          />
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={["dashboard"]}
          items={menuItems}
          className="border-0 [&_.ant-menu-item]:!text-base"
          style={{ fontSize: "16px" }}
        />
      </Sider>
      <Layout>
        <Header
          className="px-3 sm:px-4 md:px-6 flex items-center justify-between"
          style={{
            backgroundColor: "var(--admin-header-bg)",
            borderBottom: "1px solid var(--admin-header-border)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-base sm:text-lg"
            style={{ color: "var(--admin-text)" }}
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <span
              className="text-xs sm:text-sm hidden sm:inline"
              style={{ color: "var(--admin-text-secondary)" }}
            >
              Welcome, {adminUser?.full_name || "Admin"}
            </span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Avatar
                icon={<UserOutlined />}
                size={window.innerWidth < 640 ? 32 : 40}
                className="cursor-pointer bg-blue-500"
              />
            </Dropdown>
          </div>
        </Header>
        <Content
          className="m-3 sm:m-4 md:m-6 p-3 sm:p-4 md:p-6 rounded-lg"
          style={{
            backgroundColor: "var(--admin-content-bg)",
            color: "var(--admin-text)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
