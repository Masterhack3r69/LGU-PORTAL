import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { employeeService } from '@/services/employeeService';
import type { CreateEmployeeDTO } from '@/types/employee';
import { ArrowLeft, Save, Copy, Eye, EyeOff } from 'lucide-react';
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

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      employment_status: 'Active',
      sex: 'Male',
      civil_status: 'Single',
    },
  });

  const generateCredentials = (firstName: string, lastName: string, employeeNumber: string) => {
    // Generate username: first name + last name + last 3 digits of employee number
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${employeeNumber.slice(-3)}`;
    
    // Generate a random password
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    return {
      username,
      password: generatePassword()
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setIsLoading(true);
      
      // Convert date fields from ISO format to yyyy-MM-dd format
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return undefined;
        if (dateString.includes('T')) {
          // ISO format - extract date part
          return dateString.split('T')[0];
        }
        // Already in correct format
        return dateString;
      };
      
      const createData: CreateEmployeeDTO = {
        employee_number: data.employee_number,
        first_name: data.first_name,
        middle_name: data.middle_name || undefined,
        last_name: data.last_name,
        suffix: data.suffix || undefined,
        sex: data.sex,
        birth_date: formatDate(data.birth_date),
        birth_place: data.birth_place || undefined,
        civil_status: data.civil_status,
        contact_number: data.contact_number || undefined,
        email_address: data.email_address || undefined,
        current_address: data.current_address || undefined,
        permanent_address: data.permanent_address || undefined,
        tin: data.tin || undefined,
        gsis_number: data.gsis_number || undefined,
        pagibig_number: data.pagibig_number || undefined,
        philhealth_number: data.philhealth_number || undefined,
        sss_number: data.sss_number || undefined,
        appointment_date: data.appointment_date ? formatDate(data.appointment_date)! : data.appointment_date,
        plantilla_position: data.plantilla_position || undefined,
        plantilla_number: data.plantilla_number || undefined,
        salary_grade: data.salary_grade,
        step_increment: data.step_increment,
        current_daily_rate: data.current_daily_rate,
        employment_status: data.employment_status,
        separation_date: formatDate(data.separation_date),
        separation_reason: data.separation_reason || undefined,
      };
      
      // Debug logging
      console.log('Form data:', data);
      console.log('Processed data for API:', createData);
      
      await employeeService.createEmployee(createData);
      
      // Generate credentials for the new employee
      const credentials = generateCredentials(
        data.first_name, 
        data.last_name, 
        data.employee_number
      );
      
      setGeneratedCredentials(credentials);
      setShowCredentialsDialog(true);
      toast.success('Employee created successfully');
    } catch (error) {
      console.error('Failed to create employee:', error);
      // Log more detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        console.error('Error response:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);
      }
      toast.error('Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Add New Employee</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Back</span><span className='hidden sm:inline'>to Employees</span>
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
                    <FormItem >
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
                'Creating...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Employee
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Credentials Generated</DialogTitle>
            <DialogDescription>
              Login credentials have been generated for the new employee. Please share these securely.
            </DialogDescription>
          </DialogHeader>
          
          {generatedCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedCredentials.username} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCredentials.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={generatedCredentials.password} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCredentials.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please save these credentials securely. The password will not be shown again.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCredentialsDialog(false);
                navigate('/employees');
              }}
            >
              Close & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}