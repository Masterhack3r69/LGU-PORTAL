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
import { examCertificateService } from '@/services/examCertificateService';
import type { CreateEmployeeDTO, ExamCertificate } from '@/types/employee';
import { ArrowLeft, Save, Copy, Eye, EyeOff } from 'lucide-react';
import { showToast } from "@/lib/toast";
import { dateStringToDateObject, dateObjectToDateString } from '@/utils/helpers';
import { ExamCertificateManager } from '@/components/admin/ExamCertificateManager';
import { WorkExperienceManager } from '@/components/admin/WorkExperienceManager';

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
  department: z.string().optional(),
  plantilla_number: z.string().optional(),
  salary_grade: z.number().min(1).max(33).optional(),
  step_increment: z.number().min(1).max(8).optional(),
  current_daily_rate: z.number().min(0).optional(),
  employment_status: z.enum(['Active', 'Resigned', 'Retired', 'Terminated', 'AWOL']).optional(),
  separation_date: z.string().optional(),
  separation_reason: z.string().optional(),
  
  // Additional PDS fields
  height: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  blood_type: z.string().optional(),
  umid_id_no: z.string().optional(),
  philsys_number: z.string().optional(),
  agency_employee_no: z.string().optional(),
  citizenship: z.string().optional(),
  dual_citizenship_country: z.string().optional(),
  
  // Residential Address
  residential_house_no: z.string().optional(),
  residential_street: z.string().optional(),
  residential_subdivision: z.string().optional(),
  residential_barangay: z.string().optional(),
  residential_city: z.string().optional(),
  residential_province: z.string().optional(),
  residential_zipcode: z.string().optional(),
  
  // Permanent Address
  permanent_house_no: z.string().optional(),
  permanent_street: z.string().optional(),
  permanent_subdivision: z.string().optional(),
  permanent_barangay: z.string().optional(),
  permanent_city: z.string().optional(),
  permanent_province: z.string().optional(),
  permanent_zipcode: z.string().optional(),
  
  telephone_no: z.string().optional(),
  mobile_no: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [examCertificates, setExamCertificates] = useState<ExamCertificate[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);

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
      department: '',
      plantilla_number: '',
      separation_date: '',
      separation_reason: '',
      employment_status: 'Active',
      sex: 'Male',
      civil_status: 'Single',
      citizenship: 'Filipino',
      blood_type: '',
      telephone_no: '',
      mobile_no: '',
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
    showToast.success('Copied to clipboard!');
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
        department: data.department || undefined,
        plantilla_number: data.plantilla_number || undefined,
        salary_grade: data.salary_grade,
        step_increment: data.step_increment,
        current_daily_rate: data.current_daily_rate,
        employment_status: data.employment_status,
        separation_date: formatDate(data.separation_date),
        separation_reason: data.separation_reason || undefined,
      };
      
      const result = await employeeService.createEmployee(createData);
      
      // Save exam certificates if any
      if (examCertificates.length > 0 && result.employee?.id) {
        try {
          await Promise.all(
            examCertificates.map(cert =>
              examCertificateService.createExamCertificate({
                ...cert,
                employee_id: result.employee.id
              })
            )
          );
        } catch (certError) {
          console.error('Failed to save exam certificates:', certError);
          showToast.error('Employee created but some exam certificates failed to save');
        }
      }
      
      // Use credentials from backend if user account was created
      if (result.userAccount) {
        setGeneratedCredentials(result.userAccount);
        setShowCredentialsDialog(true);
      }
      
      showToast.success('Employee created successfully');
    } catch (error) {
      console.error('Failed to create employee:', error);
      showToast.error('Failed to create employee');
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

              {/* Second Row: 4 fields - Birth Date, Gender, Civil Status, Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <DatePicker
                        id="birth_date"
                        label="Birth Date"
                        placeholder="Select birth date"
                        value={dateStringToDateObject(field.value)}
                        onChange={(date) => field.onChange(dateObjectToDateString(date))}
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
              </div>

              {/* Third Row: 1 field - Birth Place */}
              <div className="grid grid-cols-1">
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
              </div>
            </CardContent>
          </Card>

          {/* Additional Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Personal Details</CardTitle>
              <CardDescription>Physical attributes and additional IDs</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Row 1: Height, Weight, Blood Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.75"
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
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="70.5"
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
                  name="blood_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Additional Government IDs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="umid_id_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UMID ID No.</FormLabel>
                      <FormControl>
                        <Input placeholder="0000-0000000-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="philsys_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PhilSys Number (PSN)</FormLabel>
                      <FormControl>
                        <Input placeholder="0000-0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agency_employee_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agency Employee No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Agency ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Citizenship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
              </div>

              {/* Row 4: Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="citizenship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Citizenship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select citizenship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Filipino">Filipino</SelectItem>
                          <SelectItem value="Dual Citizenship">Dual Citizenship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('citizenship') === 'Dual Citizenship' && (
                  <FormField
                    control={form.control}
                    name="dual_citizenship_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dual Citizenship Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="telephone_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone No.</FormLabel>
                      <FormControl>
                        <Input placeholder="(02) 1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile No.</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 912 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Residential Address (Detailed) */}
          <Card>
            <CardHeader>
              <CardTitle>Residential Address</CardTitle>
              <CardDescription>Complete residential address details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="residential_house_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House/Block/Lot No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Block 1 Lot 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residential_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residential_subdivision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdivision/Village</FormLabel>
                      <FormControl>
                        <Input placeholder="Greenfield Village" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="residential_barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barangay</FormLabel>
                      <FormControl>
                        <Input placeholder="Barangay Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residential_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City/Municipality</FormLabel>
                      <FormControl>
                        <Input placeholder="City Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residential_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Province Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residential_zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permanent Address (Detailed) */}
          <Card>
            <CardHeader>
              <CardTitle>Permanent Address</CardTitle>
              <CardDescription>Complete permanent address details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="permanent_house_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House/Block/Lot No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Block 1 Lot 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_subdivision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdivision/Village</FormLabel>
                      <FormControl>
                        <Input placeholder="Greenfield Village" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="permanent_barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barangay</FormLabel>
                      <FormControl>
                        <Input placeholder="Barangay Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City/Municipality</FormLabel>
                      <FormControl>
                        <Input placeholder="City Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Province Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="1234" {...field} />
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
                  {/* Row 1: Position and Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="IT Department" {...field} />
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
                            value={dateStringToDateObject(field.value)}
                            onChange={(date) => field.onChange(dateObjectToDateString(date))}
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

                  {/* Row 5: Separation Date and Reason - Show only when status is not Active */}
                  {form.watch('employment_status') && 
                   ['Resigned', 'Retired', 'Terminated', 'AWOL'].includes(form.watch('employment_status') || '') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="separation_date"
                        render={({ field }) => (
                          <FormItem>
                            <DatePicker
                              id="separation_date"
                              label="Separation Date"
                              placeholder="Select separation date"
                              value={dateStringToDateObject(field.value)}
                              onChange={(date) => field.onChange(dateObjectToDateString(date))}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="separation_reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Separation Reason</FormLabel>
                            <FormControl>
                              <Input placeholder="Reason for separation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
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

          {/* Civil Service Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle>IV. Civil Service Eligibility</CardTitle>
              <CardDescription>
                Career service, RA 1080 (Board/Bar) eligibility, and professional licenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExamCertificateManager
                certificates={examCertificates}
                onChange={setExamCertificates}
              />
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <CardTitle>V. Work Experience</CardTitle>
              <CardDescription>
                Include all work experience starting from most recent (write in full)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkExperienceManager
                workExperiences={workExperiences}
                onChange={setWorkExperiences}
              />
            </CardContent>
          </Card>

          {/* Learning and Development */}
          <Card>
            <CardHeader>
              <CardTitle>VII. Learning and Development (L&D)</CardTitle>
              <CardDescription>
                Training programs and interventions attended (managed in Training Management section)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground mb-2">
                  Training programs are managed separately in the Training Management section
                </p>
                <p className="text-sm text-muted-foreground">
                  After creating the employee, you can add training records from the Training menu
                </p>
              </div>
            </CardContent>
          </Card>

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