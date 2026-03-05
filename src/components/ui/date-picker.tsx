import * as React from "react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Odaberi datum",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(() => date ?? new Date());

  React.useEffect(() => {
    if (date) setMonth(date);
  }, [date]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setMonth(date ?? new Date());
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "min-w-[160px] w-[160px] justify-start text-left font-normal h-10",
            "hover:text-foreground hover:bg-accent/50",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{date ? format(date, "d.M.yyyy.", { locale: hr }) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onDateChange(d);
          }}
          month={month}
          onMonthChange={setMonth}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

