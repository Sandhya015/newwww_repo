import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';

export default function CustomDatePicker(props: DatePickerProps) {
    return (
        <DatePicker
            {...props}
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                ...(props.style || {}),
            }}
            className={`!rounded-xl ${props.className || ''}`}
        />
    );
}
