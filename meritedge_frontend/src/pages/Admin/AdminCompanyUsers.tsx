import React, { useState } from 'react';
import { Typography, Card, Table, Button, Input, Space, Modal, Form, Select, Tag, Tooltip, Breadcrumb, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, HomeOutlined, BankOutlined, TeamOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Layout/AdminLayout';
import { CompanyUser, useCompanyUsers } from '../../api/Admin/useCompanyUsers';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AdminCompanyUsers() {
    const navigate = useNavigate();
    const { companyId, organizationId } = useParams<{ companyId: string; organizationId: string }>();

    const {
        companyUsers,
        loading,
        error,
        hasMore,
        createCompanyUser,
        updateCompanyUser,
        setError,
        refresh,
        loadMore
    } = useCompanyUsers(organizationId, companyId);
    
    // const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([
    //     {
    //         id: '1',
    //         full_name: 'John Smith',
    //         email: 'john.smith@techcorp.com',
    //         company_id: '1',
    //         company_name: 'TechCorp Solutions',
    //         organization_id: '1',
    //         organization_name: 'Tech Solutions Inc',
    //         role: 'admin',
    //         status: 'active',
    //         department: 'Engineering',
    //         position: 'Senior Developer',
    //         phone: '+1-555-0123',
    //         created_at: '2024-01-15',
    //         updated_at: '2024-01-15',
    //         last_login: '2024-01-20'
    //     },
    //     {
    //         id: '2',
    //         full_name: 'Sarah Johnson',
    //         email: 'sarah.johnson@techcorp.com',
    //         company_id: '1',
    //         company_name: 'TechCorp Solutions',
    //         organization_id: '1',
    //         organization_name: 'Tech Solutions Inc',
    //         role: 'manager',
    //         status: 'active',
    //         department: 'Product Management',
    //         position: 'Product Manager',
    //         phone: '+1-555-0124',
    //         created_at: '2024-01-10',
    //         updated_at: '2024-01-10',
    //         last_login: '2024-01-19'
    //     },
    //     {
    //         id: '3',
    //         full_name: 'Mike Wilson',
    //         email: 'mike.wilson@dataflow.com',
    //         company_id: '2',
    //         company_name: 'DataFlow Systems',
    //         organization_id: '1',
    //         organization_name: 'Tech Solutions Inc',
    //         role: 'user',
    //         status: 'active',
    //         department: 'Data Science',
    //         position: 'Data Analyst',
    //         phone: '+1-555-0125',
    //         created_at: '2024-01-05',
    //         updated_at: '2024-01-05',
    //         last_login: '2024-01-18'
    //     }
    // ]);
    
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Filter company user
    const filteredUsers = companyUsers.filter(company_user => {
        const matchesSearch = !searchTerm || 
            company_user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company_user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company_user.phone.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || company_user.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'red';
            case 'manager': return 'orange';
            case 'user': return 'blue';
            case 'viewer': return 'green';
            default: return 'default';
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

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (record: CompanyUser) => (
                <div className="flex items-center gap-3">
                    <Avatar 
                        icon={<UserOutlined />} 
                        className="bg-blue-500"
                    />
                    <div>
                        <div className="font-medium">{record.full_name}</div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                        <div className="text-sm text-gray-500">{record.phone}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Organization',
            dataIndex: 'organization_id',
            key: 'organization_id',
            render: (text: string, record: CompanyUser) => (
                <Button 
                    type="link" 
                    onClick={() => navigate(`/admin/organizations`)}
                    className="!p-0 !h-auto"
                >
                    {text}
                </Button>
            ),
        },
        {
            title: 'Company',
            dataIndex: 'company_id',
            key: 'company_id',
            render: (text: string, record: CompanyUser) => (
                <Button 
                    type="link" 
                    onClick={() => navigate(`/admin/companies/${record.organization_id}`)}
                    className="!p-0 !h-auto"
                >
                    {text}
                </Button>
            ),
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: CompanyUser) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button type="text" icon={<EyeOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Edit User">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete User">
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

    const handleEdit = (user: CompanyUser) => {
        setEditingUser(user);
        editForm.setFieldsValue(user);
        setIsEditModalVisible(true);
    };

    const handleCreateSubmit = async (values: any) => {
        const result = await createCompanyUser(values);
        if (result?.success) {
            setIsCreateModalVisible(false);
            createForm.resetFields();
        }
    };

    const handleEditSubmit = async (values: any) => {
        if (editingUser) {
            const result = await updateCompanyUser(editingUser.unique_id, values);
            if (result.success) {
                setIsEditModalVisible(false);
                setEditingUser(null);
                editForm.resetFields();
            }
        }

        // if (editingUser) {
        //     const updatedUsers = companyUsers.map(user => 
        //         user.id === editingUser.id 
        //             ? { ...user, ...values, updated_at: new Date().toISOString() }
        //             : user
        //     );
        //     setCompanyUsers(updatedUsers);
        //     setIsEditModalVisible(false);
        //     setEditingUser(null);
        //     editForm.resetFields();
        // }
    };

    const getPageTitle = () => {
        if (companyId) {
            const company = companyUsers.find(u => u.company_id === companyId);
            // return `Users - ${company?.company_name || 'Company'}`;
            return `Users - Company`;
        }
        if (organizationId) {
            const org = companyUsers.find(u => u.organization_id === organizationId);
            // return `Users - ${org?.organization_name || 'Organization'}`;
            return `Users - Organization`;
        }
        return 'Company User Management';
    };

    const getPageDescription = () => {
        if (companyId) {
            return `Manage users within this company`;
        }
        if (organizationId) {
            return `Manage users within this organization`;
        }
        return 'Manage all company users and their permissions';
    };

    const getBreadcrumbItems = () => {
        const items = [
            {
                title: (
                    <Button 
                        type="link" 
                        icon={<HomeOutlined />} 
                        onClick={() => navigate('/admin/dashboard')}
                        className="!p-0"
                    >
                        Dashboard
                    </Button>
                )
            }
        ];

        if (organizationId) {
            items.push({
                title: (
                    <Button 
                        type="link" 
                        icon={<BankOutlined />} 
                        onClick={() => navigate('/admin/organizations')}
                        className="!p-0"
                    >
                        Organizations
                    </Button>
                )
            });
        }

        if (companyId) {
            items.push({
                title: (
                    <Button 
                        type="link" 
                        icon={<BankOutlined />} 
                        onClick={() => navigate(`/admin/companies/${organizationId}`)}
                        className="!p-0"
                    >
                        Companies
                    </Button>
                )
            });
        }

        items.push({ title: <span>Users</span> });
        return items;
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <Breadcrumb className="mb-4">
                    {getBreadcrumbItems().map((item, index) => (
                        <Breadcrumb.Item key={index}>
                            {item.title}
                        </Breadcrumb.Item>
                    ))}
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
                        Create User
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4 items-center">
                        <Search
                            placeholder="Search users..."
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

                {/* Users Table */}
                <Card>
                    <Table
                        columns={columns}
                        loading={loading}
                        dataSource={filteredUsers}
                        rowKey="id"
                        pagination={{
                            total: filteredUsers.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} users`,
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

                {/* Create User Modal */}
                <Modal
                    title="Create New User"
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
                            company_id: companyId, // set initial company value here
                        }}
                    >
                        <Form.Item
                            name="company_id"
                            label="Company"
                            rules={[{ required: true, message: 'Company is required' }]}
                            className="hidden"
                        >
                            <Input placeholder="Enter company" />
                        </Form.Item>

                        <Form.Item
                            name="full_name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Full name is required' }]}
                        >
                            <Input placeholder="Enter full name" />
                        </Form.Item>
                        
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Email is required' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input placeholder="Enter email address" />
                        </Form.Item>
                        
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: 'Password is required' }
                            ]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>

                        <Form.Item label="Phone Number" required>
                            <Space.Compact className="w-full">
                                <Form.Item
                                    name="country_code"
                                    noStyle
                                    rules={[{ required: true, message: 'Country code is required' }]}
                                >
                                    <Input style={{ width: '30%' }} placeholder="Enter Country code" />
                                </Form.Item>

                                <Form.Item
                                    name="phone"
                                    noStyle
                                    rules={[{ required: true, message: 'Phone number is required' }]}
                                >
                                    <Input style={{ width: '70%' }} placeholder="Enter phone number" />
                                </Form.Item>
                            </Space.Compact>
                        </Form.Item>
                    
                        <Form.Item
                            name="designation"
                            label="Designation"
                            rules={[{ required: true, message: 'Designation is required' }]}
                        >
                            <Input placeholder="Enter designation" />
                        </Form.Item>
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsCreateModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create User
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* Edit User Modal */}
                <Modal
                    title="Edit User"
                    open={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditSubmit}
                        initialValues={{
                            company_id: companyId, // set initial company value here
                        }}
                    >
                        <Form.Item
                            name="company_id"
                            label="Company"
                            rules={[{ required: true, message: 'Company is required' }]}
                            className="hidden"
                        >
                            <Input placeholder="Enter company" />
                        </Form.Item>

                        <Form.Item
                            name="full_name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Full name is required' }]}
                        >
                            <Input placeholder="Enter full name" />
                        </Form.Item>
                        
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Email is required' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input placeholder="Enter email address" />
                        </Form.Item>
                        
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: 'Password is required' }
                            ]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>

                        <Form.Item label="Phone Number" required>
                            <Space.Compact className="w-full">
                                <Form.Item
                                    name="country_code"
                                    noStyle
                                    rules={[{ required: true, message: 'Country code is required' }]}
                                >
                                    <Input style={{ width: '30%' }} placeholder="Enter Country code" />
                                </Form.Item>

                                <Form.Item
                                    name="phone"
                                    noStyle
                                    rules={[{ required: true, message: 'Phone number is required' }]}
                                >
                                    <Input style={{ width: '70%' }} placeholder="Enter phone number" />
                                </Form.Item>
                            </Space.Compact>
                        </Form.Item>
                    
                        <Form.Item
                            name="designation"
                            label="Designation"
                            rules={[{ required: true, message: 'Designation is required' }]}
                        >
                            <Input placeholder="Enter designation" />
                        </Form.Item>

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
                        
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Update User
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
