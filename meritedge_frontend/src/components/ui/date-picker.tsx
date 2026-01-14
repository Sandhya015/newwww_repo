// DatePicker component to replace antd DatePicker
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from "dayjs";

export interface DatePickerProps {
  value?: Dayjs | null;
  onChange?: (date: Dayjs | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  format?: string;
  showTime?: boolean;
  picker?: "date" | "week" | "month" | "quarter" | "year";
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  format: formatStr = "MM/dd/yyyy",
  showTime = false,
  picker = "date"
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const dateValue = value ? value.toDate() : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(dayjs(date));
    } else {
      onChange?.(null);
    }
    if (!showTime) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, formatStr) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

