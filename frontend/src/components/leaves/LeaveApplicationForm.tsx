import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';
import { toastSuccess, toastError } from "@/lib/toast";
import leaveService from '@/services/leaveService';
import type { LeaveType, LeaveValidationResult } from '@/types/leave';

const leaveApplicationSchema = z.object({
  leave_type_id: z.number().min(1, 'Please select a leave type'),
  start_date: z.date(),
  end_date: z.date(),
  reason: z.string().min(1, 'Reason is required'),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>;

interface LeaveApplicationFormProps {
  employeeId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({
  employeeId,
  onSuccess,
  onCancel
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [validation, setValidation] = useState<LeaveValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeaveApplicationFormData>({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      reason: '',
    }
  });

  const { watch } = form;
  const selectedLeaveTypeId = watch('leave_type_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
      } catch {
        toastError('Failed to load leave types');
      }
    };
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    const validateApplication = async () => {
      if (!selectedLeaveTypeId || !startDate || !endDate) {
        setValidation(null);
        return;
      }

      setIsValidating(true);
      try {
        const validationResult = await leaveService.validateLeaveApplication({
          employee_id: employeeId,
          leave_type_id: selectedLeaveTypeId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason: form.getValues('reason') || 'Validation check'
        });
        setValidation(validationResult);
      } catch (error) {
        console.error('Validation failed:', error);
        setValidation(null);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateApplication, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedLeaveTypeId, startDate, endDate, employeeId, form]);

  const onSubmit = async (data: LeaveApplicationFormData) => {
    if (validation && !validation.isValid) {
      toastError('Please fix validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveService.createLeaveApplication({
        employee_id: employeeId,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date.toISOString().split('T')[0],
        reason: data.reason,
        days_requested: validation?.calculatedDays
      });

      toastSuccess('Leave application submitted successfully');
      form.reset();
      setValidation(null);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit leave application';
      toastError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Leave Application</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leave_type_id">Leave Type *</Label>
            <Select
              value={selectedLeaveTypeId?.toString()}
              onValueChange={(value) => form.setValue('leave_type_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {type.code}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.leave_type_id && (
              <p className="text-sm text-red-600">{form.formState.errors.leave_type_id.message}</p>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !startDate && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => form.setValue('start_date', date!)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.start_date && (
                <p className="text-sm text-red-600">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !endDate && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick an end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => form.setValue('end_date', date!)}
                    disabled={(date) => !startDate || date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.end_date && (
                <p className="text-sm text-red-600">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Days Calculation */}
          {startDate && endDate && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Duration: {calculateDays()} day(s)</span>
              {validation?.calculatedDays && validation.calculatedDays !== calculateDays() && (
                <span className="text-muted-foreground">
                  (Working days: {validation.calculatedDays})
                </span>
              )}
            </div>
          )}

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-center space-x-2 text-yellow-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{warning.message}</span>
                </div>
              ))}
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              {...form.register('reason')}
              placeholder="Please provide a reason for your leave request..."
              className="min-h-[100px]"
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting || isValidating || (validation ? !validation.isValid : false)}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveApplicationForm;