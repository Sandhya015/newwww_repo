import React from 'react';
import { Typography, Card, Form, Input, Button, Switch, Select, Space } from 'antd';
import AdminLayout from '../../components/Layout/AdminLayout';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminSettings() {
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Form values:', values);
        // Handle form submission
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Title level={1} className="!mb-2">System Settings</Title>
                    <Text className="text-gray-600 dark:text-gray-400">Configure platform settings and preferences</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        platformName: 'Otomeyt AI',
                        maintenanceMode: false,
                        emailNotifications: true,
                        maxUsers: 1000,
                        sessionTimeout: 30
                    }}
                >
                    {/* General Settings */}
                    <Card title="General Settings" className="mb-6">
                        <Form.Item
                            label="Platform Name"
                            name="platformName"
                            rules={[{ required: true, message: 'Platform name is required' }]}
                        >
                            <Input placeholder="Enter platform name" />
                        </Form.Item>

                        <Form.Item
                            label="Maintenance Mode"
                            name="maintenanceMode"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            label="Email Notifications"
                            name="emailNotifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Card>

                    {/* User Management Settings */}
                    <Card title="User Management" className="mb-6">
                        <Form.Item
                            label="Maximum Users"
                            name="maxUsers"
                            rules={[{ required: true, message: 'Maximum users is required' }]}
                        >
                            <Input type="number" placeholder="Enter maximum users" />
                        </Form.Item>

                        <Form.Item
                            label="Session Timeout (minutes)"
                            name="sessionTimeout"
                            rules={[{ required: true, message: 'Session timeout is required' }]}
                        >
                            <Input type="number" placeholder="Enter session timeout" />
                        </Form.Item>
                    </Card>

                    {/* Security Settings */}
                    <Card title="Security Settings" className="mb-6">
                        <Form.Item
                            label="Password Policy"
                            name="passwordPolicy"
                        >
                            <Select placeholder="Select password policy">
                                <Option value="low">Low (6+ characters)</Option>
                                <Option value="medium">Medium (8+ characters, mixed case)</Option>
                                <Option value="high">High (10+ characters, mixed case, numbers, symbols)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Two-Factor Authentication"
                            name="twoFactorAuth"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Space>
                            <Button onClick={() => form.resetFields()}>
                                Reset
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Save Settings
                            </Button>
                        </Space>
                    </div>
                </Form>
            </div>
        </AdminLayout>
    );
}
