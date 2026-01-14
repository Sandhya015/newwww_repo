import { useState } from 'react';
import { Button, Form, Input, Modal, Select, Checkbox, message } from 'antd';

interface AddCustomFieldModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    onCreateField: (fieldData: Record<string, unknown>) => Promise<void>;
    nextOrder: number;
}

const { Option } = Select;

export default function AddCustomFieldModal({ 
    visible, 
    onCancel, 
    onSuccess, 
    onCreateField, 
    nextOrder 
}: AddCustomFieldModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const fieldTypes = [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'select', label: 'Select' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'radio', label: 'Radio' }
    ];

    const handleSubmit = async (values: Record<string, unknown>) => {
        setLoading(true);
        try {
            const fieldData = {
                label: values.label,
                type: values.type,
                enabled: values.enabled || false,
                required: values.required || false,
                order: nextOrder,
                options: values.options || []
            };

            await onCreateField(fieldData);
            form.resetFields();
            onSuccess();
            message.success('Custom field created successfully!');
        } catch (error) {
            console.error('Error creating custom field:', error);
            message.error('Failed to create custom field');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Add Custom Field"
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={600}
            className="custom-field-modal"
            styles={{
                body: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' },
                header: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' },
                content: { backgroundColor: 'var(--bg-primary)' }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="mt-4"
            >
                <Form.Item
                    name="label"
                    label={<span style={{ color: 'var(--text-primary)' }}>Field Label</span>}
                    rules={[{ required: true, message: 'Please enter field label' }]}
                >
                    <Input 
                        placeholder="Enter field label"
                        className="!rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                </Form.Item>

                <Form.Item
                    name="type"
                    label={<span style={{ color: 'var(--text-primary)' }}>Field Type</span>}
                    rules={[{ required: true, message: 'Please select field type' }]}
                >
                    <Select 
                        placeholder="Select field type"
                        className="!rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        dropdownStyle={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                        {fieldTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                {type.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="options"
                    label={<span style={{ color: 'var(--text-primary)' }}>Options (comma-separated)</span>}
                    help="Enter options separated by commas (for select, checkbox, radio fields)"
                >
                    <Input.TextArea 
                        placeholder="Option 1, Option 2, Option 3"
                        rows={3}
                        className="!rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                </Form.Item>

                <div className="flex gap-4 mb-4">
                    <Form.Item name="enabled" valuePropName="checked" className="mb-0">
                        <Checkbox style={{ color: 'var(--text-primary)' }}>
                            Enable Field
                        </Checkbox>
                    </Form.Item>

                    <Form.Item name="required" valuePropName="checked" className="mb-0">
                        <Checkbox style={{ color: 'var(--text-primary)' }}>
                            Required Field
                        </Checkbox>
                    </Form.Item>
                </div>

                <div className="flex justify-end gap-3">
                    <Button 
                        onClick={handleCancel}
                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                        style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                    >
                        Create Field
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
