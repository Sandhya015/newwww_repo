import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Input, Space, Modal, Form, Select, Tag, Tooltip, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '../../components/Layout/AdminLayout';
import { useOrganizations, Organization, CreateOrganizationData, UpdateOrganizationData } from '../../api/Admin/useOrganizations';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AdminOrganizations() {
    const {
        organizations,
        loading,
        error,
        hasMore,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        loadMore,
        refresh,
        setError
    } = useOrganizations();
    
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Filter organizations based on search and status
    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = !searchTerm || 
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || org.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const columns: ColumnsType<Organization> = [
        {
            title: 'Organization Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Billing Plan',
            dataIndex: 'billing_plan',
            key: 'billing_plan',
            render: (plan: string) => (
                <Tag color={plan === 'enterprise' ? 'red' : plan === 'premium' ? 'orange' : plan === 'basic' ? 'blue' : 'green'}>
                    {plan?.charAt(0).toUpperCase() + plan?.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Contact Email',
            dataIndex: 'contact_email',
            key: 'contact_email',
            ellipsis: true,
        },
        {
            title: 'Credits',
            key: 'credits',
            render: (record: Organization) => (
                <div className="text-center">
                    <div className="text-sm text-gray-600">
                        {record.consumed_credits} / {record.assigned_credits}
                    </div>
                    <div className="text-xs text-gray-500">
                        Reset: {record.credit_reset_day}th
                    </div>
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Organization) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Link to={`/admin/companies/${record?.unique_id}`}>
                            <Button type="text" icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Edit Organization">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Organization">
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                            onClick={() => handleDelete(record.unique_id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleCreate = () => {
        setIsCreateModalVisible(true);
    };

    const handleEdit = (organization: Organization) => {
        setEditingOrganization(organization);
        editForm.setFieldsValue(organization);
        setIsEditModalVisible(true);
    };

    const handleCreateSubmit = async (values: any) => {
        const result = await createOrganization(values);
        if (result.success) {
            setIsCreateModalVisible(false);
            createForm.resetFields();
        }
    };

    const handleEditSubmit = async (values: any) => {
        if (editingOrganization) {
            const result = await updateOrganization(editingOrganization.unique_id, values);
            if (result.success) {
                setIsEditModalVisible(false);
                setEditingOrganization(null);
                editForm.resetFields();
            }
        }
    };

    const handleDelete = async (organizationId: string) => {
        const result = await deleteOrganization(organizationId);
        if (result.success) {
            // Organization removed from state by the hook
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'pending': return 'orange';
            case 'inactive': return 'red';
            default: return 'default';
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Title level={1} className="!mb-2">Organization Management</Title>
                        <Text className="text-gray-600">Manage platform organizations and their settings</Text>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        className="!bg-blue-600"
                    >
                        Create Organization
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4 items-center">
                        <Search
                            placeholder="Search organizations..."
                            allowClear
                            style={{ width: 300 }}
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            placeholder="Filter by status"
                            style={{ width: 150 }}
                            allowClear
                            value={statusFilter}
                            onChange={setStatusFilter}
                        >
                            <Option value="active">Active</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={refresh}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                    </div>
                </Card>

                {/* Error Display */}
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        className="mb-6"
                    />
                )}

                {/* Organizations Table */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={filteredOrganizations}
                        rowKey="unique_id"
                        loading={loading}
                        pagination={{
                            total: filteredOrganizations.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} organizations`,
                        }}
                        footer={() => 
                            hasMore ? (
                                <div className="text-center">
                                    <Button 
                                        onClick={loadMore} 
                                        loading={loading}
                                        type="primary"
                                    >
                                        Load More
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                </Card>

                {/* Create Organization Modal */}
                <Modal
                    title="Create New Organization"
                    open={isCreateModalVisible}
                    onCancel={() => setIsCreateModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreateSubmit}
                    >
                        <Form.Item
                            name="name"
                            label="Organization Name"
                            rules={[{ required: true, message: 'Organization name is required' }]}
                        >
                            <Input placeholder="Enter organization name" />
                        </Form.Item>
                        
                        <Form.Item
                            name="slug"
                            label="Slug"
                            rules={[{ required: true, message: 'Slug is required' }]}
                        >
                            <Input placeholder="Enter organization slug" />
                        </Form.Item>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="contact_email"
                                label="Contact Email"
                                rules={[
                                    { required: true, message: 'Contact email is required' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="Enter contact email" />
                            </Form.Item>
                            
                            <Form.Item
                                name="support_email"
                                label="Support Email"
                                rules={[
                                    { required: true, message: 'Support email is required' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="Enter support email" />
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="billing_plan"
                                label="Billing Plan"
                                rules={[{ required: true, message: 'Billing plan is required' }]}
                                initialValue="free"
                            >
                                <Select placeholder="Select billing plan">
                                    <Option value="free">Free</Option>
                                    <Option value="basic">Basic</Option>
                                    <Option value="premium">Premium</Option>
                                    <Option value="enterprise">Enterprise</Option>
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="assigned_credits"
                                label="Assigned Credits"
                                rules={[{ required: true, message: 'Assigned credits is required' }]}
                                initialValue={0}
                            >
                                <Input type="number" placeholder="Enter assigned credits" min={0} />
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="language"
                                label="Language"
                                initialValue="en"
                            >
                                <Select placeholder="Select language">
                                    <Option value="en">English</Option>
                                    <Option value="es">Spanish</Option>
                                    <Option value="fr">French</Option>
                                    <Option value="de">German</Option>
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="timezone"
                                label="Timezone"
                                initialValue="UTC"
                            >
                                <Select placeholder="Select timezone">
                                    <Option value="UTC">UTC</Option>
                                    <Option value="America/New_York">Eastern Time</Option>
                                    <Option value="America/Chicago">Central Time</Option>
                                    <Option value="America/Denver">Mountain Time</Option>
                                    <Option value="America/Los_Angeles">Pacific Time</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="primary_color"
                                label="Primary Color"
                            >
                                <Input placeholder="Enter primary color (e.g., #007bff)" />
                            </Form.Item>
                            
                            <Form.Item
                                name="credit_reset_day"
                                label="Credit Reset Day"
                                initialValue={1}
                            >
                                <Input type="number" placeholder="Day of month (1-31)" min={1} max={31} />
                            </Form.Item>
                        </div>
                        
                        <Form.Item
                            name="logo_url"
                            label="Logo URL"
                            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                        >
                            <Input placeholder="https://example.com/logo.png" />
                        </Form.Item>
                        
                        <Form.Item
                            name="domain"
                            label="Domain"
                        >
                            <Input placeholder="Enter domain (e.g., example.com)" />
                        </Form.Item>
                        
                        <Form.Item
                            name="reseller_id"
                            label="Reseller ID"
                        >
                            <Input placeholder="Enter reseller ID (optional)" />
                        </Form.Item>
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsCreateModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create Organization
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* Edit Organization Modal */}
                <Modal
                    title="Edit Organization"
                    open={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditSubmit}
                    >
                        <Form.Item
                            name="name"
                            label="Organization Name"
                            rules={[{ required: true, message: 'Organization name is required' }]}
                        >
                            <Input placeholder="Enter organization name" />
                        </Form.Item>
                        
                        <Form.Item
                            name="slug"
                            label="Slug"
                            rules={[{ required: true, message: 'Slug is required' }]}
                        >
                            <Input placeholder="Enter organization slug" />
                        </Form.Item>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="contact_email"
                                label="Contact Email"
                                rules={[
                                    { required: true, message: 'Contact email is required' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="Enter contact email" />
                            </Form.Item>
                            
                            <Form.Item
                                name="support_email"
                                label="Support Email"
                                rules={[
                                    { required: true, message: 'Support email is required' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="Enter support email" />
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="billing_plan"
                                label="Billing Plan"
                                rules={[{ required: true, message: 'Billing plan is required' }]}
                            >
                                <Select placeholder="Select billing plan">
                                    <Option value="free">Free</Option>
                                    <Option value="basic">Basic</Option>
                                    <Option value="premium">Premium</Option>
                                    <Option value="enterprise">Enterprise</Option>
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="assigned_credits"
                                label="Assigned Credits"
                                rules={[{ required: true, message: 'Assigned credits is required' }]}
                            >
                                <Input type="number" placeholder="Enter assigned credits" />
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="language"
                                label="Language"
                            >
                                <Select placeholder="Select language">
                                    <Option value="en">English</Option>
                                    <Option value="es">Spanish</Option>
                                    <Option value="fr">French</Option>
                                    <Option value="de">German</Option>
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="timezone"
                                label="Timezone"
                            >
                                <Select placeholder="Select timezone">
                                    <Option value="UTC">UTC</Option>
                                    <Option value="America/New_York">Eastern Time</Option>
                                    <Option value="America/Chicago">Central Time</Option>
                                    <Option value="America/Denver">Mountain Time</Option>
                                    <Option value="America/Los_Angeles">Pacific Time</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="primary_color"
                                label="Primary Color"
                            >
                                <Input placeholder="Enter primary color (e.g., #007bff)" />
                            </Form.Item>
                            
                            <Form.Item
                                name="credit_reset_day"
                                label="Credit Reset Day"
                            >
                                <Input type="number" placeholder="Day of month (1-31)" min={1} max={31} />
                            </Form.Item>
                        </div>
                        
                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Status is required' }]}
                        >
                            <Select placeholder="Select status">
                                <Option value="active">Active</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                        
                        <Form.Item
                            name="logo_url"
                            label="Logo URL"
                            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                        >
                            <Input placeholder="https://example.com/logo.png" />
                        </Form.Item>
                        
                        <Form.Item
                            name="domain"
                            label="Domain"
                        >
                            <Input placeholder="Enter domain (e.g., example.com)" />
                        </Form.Item>
                        
                        <Form.Item
                            name="reseller_id"
                            label="Reseller ID"
                        >
                            <Input placeholder="Enter reseller ID (optional)" />
                        </Form.Item>
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Update Organization
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
