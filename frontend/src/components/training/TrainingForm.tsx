import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, User, Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import trainingService from '@/services/trainingService';
import { employeeService } from '@/services/employeeService';
import type { 
  TrainingProgram, 
  Training, 
  CreateTrainingDTO, 
  UpdateTrainingDTO,
  TrainingType 
} from '@/types/training';
import type { Employee } from '@/types/employee';

const trainingFormSchema = z.object({
  employee_id: z.number().min(1, 'Please select an employee'),
  training_program_id: z.number().optional(),
  training_title: z.string().min(1, 'Training title is required'),
  start_date: z.date(),
  end_date: z.date(),
  duration_hours: z.number().optional(),
  venue: z.string().optional(),
  organizer: z.string().optional(),
  certificate_issued: z.boolean(),
  certificate_number: z.string().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

interface TrainingFormProps {
  training?: Training;
  employeeId?: number; // For employee users - restrict to their own training
  onSubmit: (data: CreateTrainingDTO | UpdateTrainingDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const TrainingForm: React.FC<TrainingFormProps> = ({
  training,
  employeeId,
  onSubmit,
  onCancel,
  isLoading = false,
  readOnly = false
}) => {
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Combobox state
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');

  const isEditing = !!training;
  const isEmployee = !!employeeId; // Employee users are restricted to their own training

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      employee_id: training?.employee_id || employeeId || 0,
      training_program_id: training?.training_program_id || undefined,
      training_title: training?.training_title || '',
      start_date: training?.start_date ? new Date(training.start_date) : new Date(),
      end_date: training?.end_date ? new Date(training.end_date) : new Date(),
      duration_hours: training?.duration_hours || undefined,
      venue: training?.venue || '',
      organizer: training?.organizer || '',
      certificate_issued: training?.certificate_issued || false,
      certificate_number: training?.certificate_number || '',
    }
  });

  const { watch } = form;
  const selectedProgramId = watch('training_program_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const certificateIssued = watch('certificate_issued');

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [programs, employeesData] = await Promise.all([
          trainingService.getTrainingPrograms(),
          isEmployee ? [] : employeeService.getEmployees()
        ]);
        
        setTrainingPrograms(programs);
        if (!isEmployee) {
          setEmployees(Array.isArray(employeesData) ? employeesData : employeesData.employees || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load required data');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [isEmployee]);

  // Auto-fill training title when program is selected
  useEffect(() => {
    if (selectedProgramId) {
      const selectedProgram = trainingPrograms.find(p => p.id === selectedProgramId);
      if (selectedProgram) {
        form.setValue('training_title', selectedProgram.title);
        if (selectedProgram.duration_hours) {
          form.setValue('duration_hours', selectedProgram.duration_hours);
        }
      }
    }
  }, [selectedProgramId, trainingPrograms, form]);

  // Auto-calculate duration based on dates
  useEffect(() => {
    if (startDate && endDate) {
      const hours = trainingService.calculateDuration(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        8 // Default 8 hours per day
      );
      if (!form.getValues('duration_hours')) {
        form.setValue('duration_hours', hours);
      }
    }
  }, [startDate, endDate, form]);

  const handleSubmit = async (data: TrainingFormData) => {
    try {
      const submissionData = {
        employee_id: data.employee_id,
        training_program_id: data.training_program_id || undefined,
        training_title: data.training_title,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date.toISOString().split('T')[0],
        duration_hours: data.duration_hours || undefined,
        venue: data.venue || undefined,
        organizer: data.organizer || undefined,
        certificate_issued: data.certificate_issued,
        certificate_number: data.certificate_issued ? data.certificate_number : undefined,
      };

      onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to process form data');
    }
  };

  const getTrainingTypeFromProgram = (programId: number): TrainingType | undefined => {
    const program = trainingPrograms.find(p => p.id === programId);
    return program?.training_type;
  };

  // Helper function to get employee full name
  const getEmployeeFullName = (employee: Employee) => {
    const parts = [employee.first_name, employee.middle_name, employee.last_name, employee.suffix]
      .filter(Boolean);
    return parts.join(' ');
  };

  // Filter employees based on search value
  const filteredEmployees = employees.filter(employee => {
    const fullName = getEmployeeFullName(employee);
    const searchTerm = employeeSearchValue.toLowerCase();
    return fullName.toLowerCase().includes(searchTerm) || 
           employee.employee_number?.toLowerCase().includes(searchTerm);
  });

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Employee Selection (Admin only) */}
          <div className='grid grid-cols-2 gap-4'>
            {!isEmployee && (
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Popover open={employeeComboboxOpen} onOpenChange={setEmployeeComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeComboboxOpen}
                      className="w-full justify-between"
                      disabled={readOnly}
                    >
                      {form.watch('employee_id')
                        ? (() => {
                            const selectedEmployee = employees.find(
                              (employee) => employee.id === form.watch('employee_id')
                            );
                            return selectedEmployee
                              ? `${getEmployeeFullName(selectedEmployee)} (${selectedEmployee.employee_number})`
                              : "Select employee...";
                          })()
                        : "Select employee..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="flex flex-col">
                      <div className="p-2">
                        <Input
                          placeholder="Search employees..."
                          value={employeeSearchValue}
                          onChange={(e) => setEmployeeSearchValue(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-auto">
                        {filteredEmployees.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No employee found.
                          </div>
                        ) : (
                          filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className={cn(
                                "flex cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                                form.watch('employee_id') === employee.id && "bg-accent"
                              )}
                              onClick={() => {
                                form.setValue('employee_id', employee.id);
                                setEmployeeComboboxOpen(false);
                                setEmployeeSearchValue('');
                              }}
                            >
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>{getEmployeeFullName(employee)} ({employee.employee_number})</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  form.watch('employee_id') === employee.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.employee_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.employee_id.message}</p>
                )}
              </div>
            )}
                      {/* Training Program Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="training_program_id">Training Program (Optional)</Label>
              <Select
                value={selectedProgramId?.toString() || 'none'}
                onValueChange={(value) => form.setValue('training_program_id', value && value !== 'none' ? parseInt(value) : undefined)}
                disabled={readOnly}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Select training program (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Custom Training</SelectItem>
                  {trainingPrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{program.title}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline">{program.training_type}</Badge>
                          {program.duration_hours && (
                            <Badge variant="secondary">{program.duration_hours}h</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>



          {/* Training Title */}
          <div className="space-y-2">
            <Label htmlFor="training_title">Training Title *</Label>
            <Input
              {...form.register('training_title')}
              placeholder="Enter training title"
              disabled={readOnly}
            />
            {form.formState.errors.training_title && (
              <p className="text-sm text-red-600">{form.formState.errors.training_title.message}</p>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                    disabled={(date) => startDate && date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.end_date && (
                <p className="text-sm text-red-600">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Duration and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration Hours */}
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (Hours)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                {...form.register('duration_hours', { valueAsNumber: true })}
                placeholder="Auto-calculated"
                disabled={readOnly}
              />
            </div>

            {/* Program Type Badge */}
            {selectedProgramId && (
              <div className="space-y-2">
                <Label>Training Type</Label>
                <div className="flex items-center h-10">
                  <Badge variant="outline" className="text-sm">
                    {getTrainingTypeFromProgram(selectedProgramId)}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Venue and Organizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register('venue')}
                  placeholder="Training venue"
                  className="pl-10"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizer">Organizer</Label>
              <Input
                {...form.register('organizer')}
                placeholder="Training organizer"
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Certificate Information */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Switch
                checked={certificateIssued}
                onCheckedChange={(checked) => form.setValue('certificate_issued', checked)}
                disabled={readOnly}
              />
              <Label htmlFor="certificate_issued">Certificate Issued</Label>
            </div>

            {certificateIssued && (
              <div className="space-y-2">
                <Label htmlFor="certificate_number">Certificate Number</Label>
                <Input
                  {...form.register('certificate_number')}
                  placeholder="Certificate number"
                  disabled={readOnly}
                />
              </div>
            )}
          </div>

        {/* Form Actions */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update Training' : 'Create Training'}</>
              )}
            </Button>
          </div>
        )}
      </form>
  );
};

export default TrainingForm;