// InputNumber component to replace antd InputNumber
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  parser?: (value: string) => string;
  formatter?: (value: number | undefined) => string;
}

export default function InputNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision,
  parser,
  formatter,
  className,
  disabled,
  ...props
}: InputNumberProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value !== undefined && value !== null ? String(value) : ""
  );

  React.useEffect(() => {
    if (value !== undefined && value !== null) {
      const formatted = formatter ? formatter(value) : String(value);
      setInputValue(formatted);
    } else {
      setInputValue("");
    }
  }, [value, formatter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (parser) {
      newValue = parser(newValue);
    }

    setInputValue(newValue);

    if (newValue === "" || newValue === "-") {
      onChange?.(null);
      return;
    }

    const numValue = parseFloat(newValue);
    
    if (isNaN(numValue)) {
      return;
    }

    let finalValue = numValue;

    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }

    if (precision !== undefined) {
      finalValue = parseFloat(finalValue.toFixed(precision));
    }

    onChange?.(finalValue);
  };

  const handleBlur = () => {
    if (inputValue === "" || inputValue === "-") {
      setInputValue("");
      onChange?.(null);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      setInputValue(value !== undefined && value !== null ? String(value) : "");
      return;
    }

    let finalValue = numValue;
    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }
    if (precision !== undefined) {
      finalValue = parseFloat(finalValue.toFixed(precision));
    }

    const formatted = formatter ? formatter(finalValue) : String(finalValue);
    setInputValue(formatted);
    onChange?.(finalValue);
  };

  return (
    <Input
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(className)}
      {...props}
    />
  );
}

