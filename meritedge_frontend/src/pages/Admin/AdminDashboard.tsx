import React from "react";
import { Typography, Card, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/Layout/AdminLayout";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Title level={1} className="!mb-2 !text-xl sm:!text-2xl md:!text-3xl">
            Admin Dashboard
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">
            Welcome to the platform administration panel
          </Text>
        </div>

        {/* Stats Cards */}
        <Row gutter={[12, 12]} className="mb-6 sm:mb-8 sm:!gap-x-4">
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Title level={3} className="!text-blue-600 !mb-2">
                0
              </Title>
              <Text className="text-gray-600">Total Users</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Title level={3} className="!text-green-600 !mb-2">
                0
              </Title>
              <Text className="text-gray-600">Active Users</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Title level={3} className="!text-purple-600 !mb-2">
                0
              </Title>
              <Text className="text-gray-600">Total Assessments</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Title level={3} className="!text-orange-600 !mb-2">
                0
              </Title>
              <Text className="text-gray-600">System Status</Text>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Recent Activity" className="mb-6">
              <div className="text-center py-8">
                <Text className="text-gray-500 dark:text-gray-400">
                  No recent activity to display
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Quick Actions" className="mb-6">
              <div className="space-y-3">
                <div
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  onClick={() => navigate("/admin/organizations")}
                >
                  Manage Organizations
                </div>
                <div
                  className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  onClick={() => navigate("/admin/companies")}
                >
                  Manage Companies
                </div>
                <div
                  className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-center cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  onClick={() => navigate("/admin/company-users")}
                >
                  Manage Company Users
                </div>
                <div
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                  onClick={() => navigate("/admin/settings")}
                >
                  System Settings
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
