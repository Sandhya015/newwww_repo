import { InputHTMLAttributes } from "react";

export const CustomInput = ({ value, onChange, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
    
    return (
        <input
            {...props}
            value={value ?? ''}
            onChange={onChange}
            className={`flex-1 shrink gap-2.5 self-stretch px-5 py-3.5 my-auto w-full ${props['aria-invalid'] ? 'border-2 border-red-400' : 'border'} border-solid basis-0 min-h-9 min-w-60 rounded-[40px] focus:outline-none`}
            style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: props['aria-invalid'] ? '#f87171' : 'var(--border-primary)',
                ...props.style
            }}
        />
    );
};
