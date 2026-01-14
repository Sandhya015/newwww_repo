import React, { useState } from 'react';
import { Typography, Card, Table, Button, Input, Space, Modal, Form, Select, Tag, Tooltip, Breadcrumb, Alert } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, HomeOutlined, BankOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Layout/AdminLayout';
import { useOrganizations } from '../../api/Admin/useOrganizations';
import { Company, useCompanies } from '../../api/Admin/useCompanies';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AdminCompanies() {
    const navigate = useNavigate();
    const { organizationId } = useParams<{ organizationId: string }>();

    const {
        organizations
    } = useOrganizations();

    const {
        companies,
        loading,
        error,
        hasMore,
        createCompany,
        updateCompany,
        setError,
        refresh,
        loadMore
    } = useCompanies(organizationId);

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Filter companies
    const filteredCompanies = companies.filter(org => {
        const matchesSearch = !searchTerm || 
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.support_email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || org.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            title: 'Company Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Organization',
            dataIndex: 'organization_id',
            key: 'organization_name',
            render: (text: string) => (
                <Text strong className="!text-blue-600 dark:!text-blue-500 hover:!underline">
                    {text}
                </Text>
            ),
        },
        {
            title: 'Contact Email',
            dataIndex: 'contact_email',
            key: 'contact_email',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Support Email',
            dataIndex: 'support_email',
            key: 'support_email',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Billing Plan',
            dataIndex: 'billing_plan',
            key: 'billing_plan',
            render: (text: string) => <Text strong className="!capitalize">{text}</Text>,
        },
        {
            title: 'Timezone',
            dataIndex: 'timezone',
            key: 'timezone',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Language',
            dataIndex: 'language',
            key: 'language',
            render: (text: string) => <Text strong className="!capitalize">{text}</Text>,
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expiry_date',
            key: 'expiry_date',
            render: (text: string) => <Text strong className="!capitalize">{text}</Text>,
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
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Company) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Link to={`/admin/company-users/${organizationId}/${record?.unique_id}`}>
                            <Button type="text" icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Edit Company">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Company">
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleCreate = () => {
        setIsCreateModalVisible(true);
    };

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        editForm.setFieldsValue(company);
        setIsEditModalVisible(true);
    };

    const handleCreateSubmit = async (values: any) => {
        const result = await createCompany(values);
        if (result?.success) {
            setIsCreateModalVisible(false);
            createForm.resetFields();
        }
    };

    const handleEditSubmit = async (values: any) => {
        if (editingCompany) {
            const result = await updateCompany(editingCompany.unique_id, values);
            if (result.success) {
                setIsEditModalVisible(false);
                setEditingCompany(null);
                editForm.resetFields();
            }
        }
    };

    const getPageTitle = () => {
        if (organizationId) {
            const org = companies.find(c => c.organization_id === organizationId);
            // return `Companies - ${org?.organization_name || 'Organization'}`;
            return `Companies - Organization`;
        }
        return 'Company Management';
    };

    const getPageDescription = () => {
        if (organizationId) {
            return `Manage companies within this organization`;
        }
        return 'Manage all platform companies and their settings';
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <Breadcrumb className="mb-4">
                    <Breadcrumb.Item>
                        <Button 
                            type="link" 
                            icon={<HomeOutlined />} 
                            onClick={() => navigate('/admin/dashboard')}
                            className="!p-0"
                        >
                            Dashboard
                        </Button>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Button 
                            type="link" 
                            icon={<BankOutlined />} 
                            onClick={() => navigate('/admin/organizations')}
                            className="!p-0"
                        >
                            Organizations
                        </Button>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Companies</Breadcrumb.Item>
                </Breadcrumb>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Title level={1} className="!mb-2">{getPageTitle()}</Title>
                        <Text className="text-gray-600">{getPageDescription()}</Text>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        className="!bg-blue-600"
                    >
                        Create Company
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4 items-center">
                        <Search
                            placeholder="Search companies..."
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

                        {/* <Button>Apply Filters</Button> */}

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

                {/* Companies Table */}
                <Card>
                    <Table
                        columns={columns}
                        loading={loading}
                        dataSource={filteredCompanies}
                        rowKey="id"
                        pagination={{
                            total: filteredCompanies.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} companies`,
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

                {/* Create Company Modal */}
                <Modal
                    title="Create New Company"
                    open={isCreateModalVisible}
                    onCancel={() => setIsCreateModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreateSubmit}
                        initialValues={{
                            organization_id: organizationId, // set initial organization value here
                        }}
                    >
                        <Form.Item
                            name="organization_id"
                            label="Organization"
                            rules={[{ required: true, message: 'Organization is required' }]}
                        >
                            <Select placeholder="Select organization">
                                {organizations?.map((organization, index) => (
                                    <Option value={organization?.unique_id} key={index}>{organization?.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Company Name"
                            rules={[{ required: true, message: 'Company name is required' }]}
                        >
                            <Input placeholder="Enter company name" />
                        </Form.Item>

                        <Form.Item
                            name="company_logo"
                            label="Company Logo"
                            rules={[
                                { required: true, message: 'Company logo is required' },
                                { type: 'url', message: 'Please enter a valid url' }
                            ]}
                        >
                            <Input placeholder="https://example.com/logo.png" />
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
                            name="expiry_date"
                            label="Expiry Date"
                        >
                            <Input placeholder="Enter expiry date" />
                        </Form.Item>

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
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsCreateModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create Company
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* Edit Company Modal */}
                <Modal
                    title="Edit Company"
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
                            name="organization_id"
                            label="Organization"
                            rules={[{ required: true, message: 'Organization is required' }]}
                        >
                            <Select placeholder="Select organization">
                                {organizations?.map((organization, index) => (
                                    <Option value={organization?.unique_id} key={index}>{organization?.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Company Name"
                            rules={[{ required: true, message: 'Company name is required' }]}
                        >
                            <Input placeholder="Enter company name" />
                        </Form.Item>

                        <Form.Item
                            name="company_logo"
                            label="Company Logo"
                            rules={[
                                { required: true, message: 'Company logo is required' },
                                { type: 'url', message: 'Please enter a valid url' }
                            ]}
                        >
                            <Input placeholder="https://example.com/logo.png" />
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
                            name="expiry_date"
                            label="Expiry Date"
                        >
                            <Input placeholder="Enter expiry date" />
                        </Form.Item>

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
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Update Company
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
