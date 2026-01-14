import { Select } from "antd";

interface CustomSelectProps {
  placeholder?: string;
  prefix?: React.ReactNode;
  options?: any[];
  selectedBg?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export default function CustomSelect({
  placeholder,
  prefix,
  options,
  selectedBg,
  className,
  style,
  ...rest
}: CustomSelectProps) {
  const mergedStyle: React.CSSProperties = {
    width: style?.width || "100%",
    color: "var(--text-primary)",
    backgroundColor: selectedBg || style?.backgroundColor || "var(--bg-secondary)",
    ...style,
  };

  return (
    <Select
      {...rest}
      prefix={prefix}
      style={mergedStyle}
      placeholder={
        <span style={{ color: "#9CA3AF", opacity: 1 }}>{placeholder}</span>
      }
      options={options}
      popupMatchSelectWidth={false}
      allowClear={false}
      showSearch={false}
      className={`
        !w-full !h-[40px]
        [&_.ant-select-selector]:!rounded-xl
        [&_.ant-select-selector]:!border-none
        [&_.ant-select-selector]:!text-[var(--text-primary)]
        [&_.ant-select-selection-placeholder]:!text-[#9CA3AF]
        [&_.ant-select-selector_.ant-select-selection-placeholder]:!text-[#9CA3AF]
        [&_.ant-select-selection-placeholder]:!opacity-100
        [&_.ant-select-selection-item]:!text-[var(--text-primary)]
        [&_.ant-select-arrow]:!text-[var(--text-primary)]
        [&_.ant-select-selector]:!bg-[var(--bg-secondary)]
        ${className || ""}
      `}
      popupClassName="
        !bg-[var(--bg-secondary)] 
        !rounded-xl 
        !text-[var(--text-primary)] 
        [&_.ant-select-item]:!text-[var(--text-primary)]
        [&_.ant-select-item-option-content]:!text-[var(--text-primary)]
        [&_.ant-select-item-option-selected]:!bg-[var(--bg-tertiary)] [&_.ant-select-item-option-selected]:!text-[var(--text-primary)]
        [&_.ant-select-item-option-active]:!bg-[var(--bg-tertiary)] [&_.ant-select-item-option-active]:!text-[var(--text-primary)]
        [&_.ant-select-item-option-disabled]:!opacity-40 [&_.ant-select-item-option-disabled]:!cursor-not-allowed [&_.ant-select-item-option-disabled]:!text-[var(--text-tertiary)]
      "
    />
  );
}
