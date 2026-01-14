import React from 'react';
import { Typography, Card, Table, Button, Input, Space } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/Layout/AdminLayout';

const { Title, Text } = Typography;
const { Search } = Input;

export default function AdminUsers() {
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space size="middle">
                    <Button type="link" size="small">Edit</Button>
                    <Button type="link" size="small" danger>Delete</Button>
                </Space>
            ),
        },
    ];

    const data = [
        {
            key: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'User',
            status: 'Active',
        },
        {
            key: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Manager',
            status: 'Active',
        },
    ];

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Title level={1} className="!mb-2">User Management</Title>
                        <Text className="text-gray-600 dark:text-gray-400">Manage platform users and their permissions</Text>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />}>
                        Add User
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4">
                        <Search
                            placeholder="Search users..."
                            allowClear
                            style={{ width: 300 }}
                        />
                        <Button>Filter</Button>
                    </div>
                </Card>

                {/* Users Table */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={data}
                        pagination={{
                            total: data.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }}
                    />
                </Card>
            </div>
        </AdminLayout>
    );
}
