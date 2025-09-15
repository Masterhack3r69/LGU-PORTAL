"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function DatePicker({
  id,
  label,
  placeholder = "Select date",
  value,
  onChange,
  disabled = false,
  className = "w-full",
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor={id} className="px-1">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className={`justify-between font-normal ${className}`}
            disabled={disabled}
          >
            {value ? value.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={handleSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}