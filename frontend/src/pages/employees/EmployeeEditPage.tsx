import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { employeeService } from '@/services/employeeService';
import type { Employee, UpdateEmployeeDTO } from '@/types/employee';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const employeeSchema = z.object({
  employee_number: z.string().min(1, 'Employee number is required'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional(),
  sex: z.enum(['Male', 'Female']).optional(),
  birth_date: z.string().optional(),
  birth_place: z.string().optional(),
  civil_status: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).optional(),
  contact_number: z.string().optional(),
  email_address: z.string().email('Invalid email address').optional().or(z.literal('')),
  current_address: z.string().optional(),
  permanent_address: z.string().optional(),
  tin: z.string().optional(),
  gsis_number: z.string().optional(),
  pagibig_number: z.string().optional(),
  philhealth_number: z.string().optional(),
  sss_number: z.string().optional(),
  appointment_date: z.string().min(1, 'Appointment date is required'),
  plantilla_position: z.string().optional(),
  plantilla_number: z.string().optional(),
  salary_grade: z.number().min(1).max(33).optional(),
  step_increment: z.number().min(1).max(8).optional(),
  current_daily_rate: z.number().min(0).optional(),
  employment_status: z.enum(['Active', 'Resigned', 'Retired', 'Terminated', 'AWOL']).optional(),
  separation_date: z.string().optional(),
  separation_reason: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      birth_date: '',
      birth_place: '',
      contact_number: '',
      email_address: '',
      current_address: '',
      permanent_address: '',
      tin: '',
      gsis_number: '',
      pagibig_number: '',
      philhealth_number: '',
      sss_number: '',
      appointment_date: '',
      plantilla_position: '',
      plantilla_number: '',
      separation_date: '',
      separation_reason: '',
    },
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      try {
        setIsLoadingEmployee(true);
        const emp = await employeeService.getEmployee(parseInt(id));
        setEmployee(emp);
        
        // Helper function to format dates for form inputs - same as ProfilePage
        const formatDateForInput = (dateString: string | null | undefined): string => {
          if (!dateString) return '';
          
          // If it's already in yyyy-MM-dd format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          
          // If it's an ISO string or other format, convert to yyyy-MM-dd
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          } catch {
            return '';
          }
        };
        
        // Helper function to ensure string values (convert null to empty string)
        const ensureString = (value: string | null | undefined) => value || '';
        
        // Helper function to ensure number values
        const ensureNumber = (value: number | null | undefined) => value || undefined;
        
        // Set form values
        form.reset({
          employee_number: ensureString(emp.employee_number),
          first_name: ensureString(emp.first_name),
          middle_name: ensureString(emp.middle_name),
          last_name: ensureString(emp.last_name),
          suffix: ensureString(emp.suffix),
          sex: emp.sex,
          birth_date: formatDateForInput(emp.birth_date),
          birth_place: ensureString(emp.birth_place),
          civil_status: emp.civil_status,
          contact_number: ensureString(emp.contact_number),
          email_address: ensureString(emp.email_address),
          current_address: ensureString(emp.current_address),
          permanent_address: ensureString(emp.permanent_address),
          tin: ensureString(emp.tin),
          gsis_number: ensureString(emp.gsis_number),
          pagibig_number: ensureString(emp.pagibig_number),
          philhealth_number: ensureString(emp.philhealth_number),
          sss_number: ensureString(emp.sss_number),
          appointment_date: formatDateForInput(emp.appointment_date),
          plantilla_position: ensureString(emp.plantilla_position),
          plantilla_number: ensureString(emp.plantilla_number),
          salary_grade: ensureNumber(emp.salary_grade),
          step_increment: ensureNumber(emp.step_increment),
          current_daily_rate: ensureNumber(emp.current_daily_rate),
          employment_status: emp.employment_status,
          separation_date: formatDateForInput(emp.separation_date),
          separation_reason: ensureString(emp.separation_reason),
        });
      } catch (error) {
        console.error('Failed to fetch employee:', error);
        toast.error('Failed to load employee data');
        navigate('/employees');
      } finally {
        setIsLoadingEmployee(false);
      }
    };

    fetchEmployee();
  }, [id, form, navigate]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;
    
    try {
      setIsLoading(true);
      
      // Robust date formatting function - same as ProfilePage
      const formatDate = (dateString: string | undefined): string | undefined => {
        if (!dateString) return undefined;
        
        // If it's already in yyyy-MM-dd format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        
        // Handle ISO string or date input value
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date provided to formatDate:', dateString);
            return undefined;
          }
          
          // Format to yyyy-MM-dd for database
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          return undefined;
        }
      };
      
      const updateData: UpdateEmployeeDTO = {
        id: employee.id,
        ...data,
        email_address: data.email_address || undefined,
        appointment_date: data.appointment_date ? formatDate(data.appointment_date)! : data.appointment_date,
        birth_date: formatDate(data.birth_date),
        separation_date: formatDate(data.separation_date),
      };
      
      await employeeService.updateEmployee(employee.id, updateData);
      toast.success('Employee updated successfully');
      navigate('/employees');
    } catch (error) {
      console.error('Failed to update employee:', error);
      toast.error('Failed to update employee');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading employee data...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
            <p className="text-muted-foreground">
              Update employee information for {employee.first_name} {employee.last_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic personal details of the employee</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* First Row: 5 fields - Employee ID, First Name, Middle Name, Last Name, Suffix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="employee_number"
                  render={({ field }) => (
                    <FormItem >
                      <FormLabel>Employee Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem >
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Michael" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                
                  control={form.control}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem >
                      <FormLabel>Suffix</FormLabel>
                      <FormControl>
                        <Input placeholder="Jr., Sr., III" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row: 5 fields - Birth Date, Gender, Civil Status, Email, Contact Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <DatePicker
                        id="birth_date"
                        label="Birth Date"
                        placeholder="Select birth date"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem >
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="civil_status"
                  render={({ field }) => (
                    <FormItem >
                      <FormLabel>Civil Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select civil status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Separated">Separated</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 912 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Third Row: 2 fields - Birth Place, Current Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birth_place"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Place</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="current_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Complete current address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fourth Row: 1 field - Permanent Address */}
              <div className="grid grid-cols-1">
                <FormField
                  control={form.control}
                  name="permanent_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Complete permanent address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employment Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
                <CardDescription>
                  Job-related details and compensation
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4">
                  {/* Row 1: Position */}
                  <div className="grid grid-cols-1">
                    <FormField
                      control={form.control}
                      name="plantilla_position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Software Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Plantilla Number and Appointment Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="plantilla_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla Number</FormLabel>
                          <FormControl>
                            <Input placeholder="P-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="appointment_date"
                      render={({ field }) => (
                        <FormItem>
                          <DatePicker
                            id="appointment_date"
                            label="Appointment Date"
                            placeholder="Select appointment date"
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            required
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Salary Grade, Step Increment, and Daily Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="current_daily_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="1200.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salary_grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Grade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="33"
                              placeholder="(1-33)"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="step_increment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Step Increment</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="8"
                              placeholder="(1-8)"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>
                  {/* Row 4: Status */}
                  <div className="grid grid-cols-1">
                    <FormField
                      control={form.control}
                      name="employment_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Resigned">Resigned</SelectItem>
                              <SelectItem value="Retired">Retired</SelectItem>
                              <SelectItem value="Terminated">Terminated</SelectItem>
                              <SelectItem value="AWOL">AWOL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Government IDs Card */}
            <Card>
              <CardHeader>
                <CardTitle>Government IDs</CardTitle>
                <CardDescription>
                  Government identification numbers
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1">
                  <FormField
                    control={form.control}
                    name="tin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TIN</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-789-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1">
                  <FormField
                    control={form.control}
                    name="gsis_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSIS Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1">
                  <FormField
                    control={form.control}
                    name="pagibig_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pag-IBIG Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1">
                  <FormField
                    control={form.control}
                    name="philhealth_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PhilHealth Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12-345678901-2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1">
                  <FormField
                    control={form.control}
                    name="sss_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSS Number</FormLabel>
                        <FormControl>
                          <Input placeholder="03-1234567-8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                'Updating...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Employee
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}