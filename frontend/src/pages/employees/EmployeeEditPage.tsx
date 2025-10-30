import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { employeeService } from "@/services/employeeService";
import { examCertificateService } from "@/services/examCertificateService";
import type { Employee, UpdateEmployeeDTO, ExamCertificate } from "@/types/employee";
import { ArrowLeft, Save } from "lucide-react";
import { showToast } from "@/lib/toast";
import { dateStringToDateObject, dateObjectToDateString } from "@/utils/helpers";
import { ExamCertificateManager } from "@/components/admin/ExamCertificateManager";
import { WorkExperienceManager } from "@/components/admin/WorkExperienceManager";
import { TrainingProgramMiniManager } from "@/components/admin/TrainingProgramMiniManager";

const employeeSchema = z.object({
  employee_number: z.string().min(1, "Employee number is required"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  birth_date: z.string().optional(),
  birth_place: z.string().optional(),
  civil_status: z
    .enum(["Single", "Married", "Widowed", "Separated", "Divorced"])
    .optional(),
  contact_number: z.string().optional(),
  email_address: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  current_address: z.string().optional(),
  permanent_address: z.string().optional(),
  tin: z.string().optional(),
  gsis_number: z.string().optional(),
  pagibig_number: z.string().optional(),
  philhealth_number: z.string().optional(),
  sss_number: z.string().optional(),
  appointment_date: z.string().min(1, "Appointment date is required"),
  plantilla_position: z.string().optional(),
  department: z.string().optional(),
  plantilla_number: z.string().optional(),
  salary_grade: z
    .union([
      z.number().min(1).max(33),
      z.string().transform((val) => (val === "" ? undefined : Number(val))),
    ])
    .optional(),
  step_increment: z
    .union([
      z.number().min(1).max(8),
      z.string().transform((val) => (val === "" ? undefined : Number(val))),
    ])
    .optional(),
  current_daily_rate: z
    .union([
      z.number().min(0),
      z.string().transform((val) => (val === "" ? undefined : Number(val))),
    ])
    .optional(),
  employment_status: z
    .enum(["Active", "Resigned", "Retired", "Terminated", "AWOL"])
    .optional(),
  separation_date: z.string().optional(),
  separation_reason: z.string().optional(),
  
  // Additional PDS fields
  height: z
    .union([
      z.number().min(0),
      z.string().transform((val) => (val === "" ? undefined : Number(val))),
    ])
    .optional(),
  weight: z
    .union([
      z.number().min(0),
      z.string().transform((val) => (val === "" ? undefined : Number(val))),
    ])
    .optional(),
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

export function EmployeeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [examCertificates, setExamCertificates] = useState<ExamCertificate[]>([]);
  const [originalCertificates, setOriginalCertificates] = useState<ExamCertificate[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [originalTrainings, setOriginalTrainings] = useState<any[]>([]);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      employee_number: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      birth_date: "",
      birth_place: "",
      contact_number: "",
      email_address: "",
      current_address: "",
      permanent_address: "",
      tin: "",
      gsis_number: "",
      pagibig_number: "",
      philhealth_number: "",
      sss_number: "",
      appointment_date: "",
      plantilla_position: "",
      department: "",
      plantilla_number: "",
      separation_date: "",
      separation_reason: "",
    },
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;

      try {
        setIsLoadingEmployee(true);
        const emp = await employeeService.getEmployee(parseInt(id));
        setEmployee(emp);

        // Fetch exam certificates
        try {
          const certs = await examCertificateService.getExamCertificatesByEmployee(parseInt(id));
          setExamCertificates(certs || []);
          setOriginalCertificates(certs || []);
        } catch (certError) {
          console.error('Failed to fetch exam certificates:', certError);
          setExamCertificates([]);
          setOriginalCertificates([]);
        }

        // Fetch trainings
        try {
          const { trainingService } = await import('@/services/trainingService');
          const trainingHistory = await trainingService.getEmployeeTrainingHistory(parseInt(id));
          setTrainings(trainingHistory.trainings || []);
          setOriginalTrainings(trainingHistory.trainings || []);
        } catch (trainingError) {
          console.error('Failed to fetch trainings:', trainingError);
          setTrainings([]);
          setOriginalTrainings([]);
        }

        // Helper function to format dates for form inputs - same as ProfilePage
        const formatDateForInput = (
          dateString: string | null | undefined
        ): string => {
          if (!dateString) return "";

          // If it's already in yyyy-MM-dd format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }

          // If it's an ISO string or other format, convert to yyyy-MM-dd using UTC to avoid timezone issues
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";

            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const day = String(date.getUTCDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
          } catch {
            return "";
          }
        };

        // Helper function to ensure string values (convert null to empty string)
        const ensureString = (value: string | null | undefined) => value || "";

        // Helper function to ensure number values
        const ensureNumber = (value: number | null | undefined) =>
          value || undefined;

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
          department: ensureString(emp.department),
          plantilla_number: ensureString(emp.plantilla_number),
          salary_grade: ensureNumber(emp.salary_grade),
          step_increment: ensureNumber(emp.step_increment),
          current_daily_rate: ensureNumber(emp.current_daily_rate),
          employment_status: emp.employment_status || "Active",
          separation_date: formatDateForInput(emp.separation_date),
          separation_reason: ensureString(emp.separation_reason),
          
          // Additional PDS fields
          height: ensureNumber(emp.height),
          weight: ensureNumber(emp.weight),
          blood_type: ensureString(emp.blood_type),
          umid_id_no: ensureString(emp.umid_id_no),
          philsys_number: ensureString(emp.philsys_number),
          agency_employee_no: ensureString(emp.agency_employee_no),
          citizenship: ensureString(emp.citizenship) || 'Filipino',
          dual_citizenship_country: ensureString(emp.dual_citizenship_country),
          
          // Residential Address
          residential_house_no: ensureString(emp.residential_house_no),
          residential_street: ensureString(emp.residential_street),
          residential_subdivision: ensureString(emp.residential_subdivision),
          residential_barangay: ensureString(emp.residential_barangay),
          residential_city: ensureString(emp.residential_city),
          residential_province: ensureString(emp.residential_province),
          residential_zipcode: ensureString(emp.residential_zipcode),
          
          // Permanent Address
          permanent_house_no: ensureString(emp.permanent_house_no),
          permanent_street: ensureString(emp.permanent_street),
          permanent_subdivision: ensureString(emp.permanent_subdivision),
          permanent_barangay: ensureString(emp.permanent_barangay),
          permanent_city: ensureString(emp.permanent_city),
          permanent_province: ensureString(emp.permanent_province),
          permanent_zipcode: ensureString(emp.permanent_zipcode),
          
          telephone_no: ensureString(emp.telephone_no),
          mobile_no: ensureString(emp.mobile_no),
        });
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        showToast.error("Failed to load employee data");
        navigate("/employees");
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
      const formatDate = (
        dateString: string | undefined
      ): string | undefined => {
        if (!dateString) return undefined;

        // If it's already in yyyy-MM-dd format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }

        // Handle ISO string or date input value using UTC to avoid timezone issues
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            console.warn("Invalid date provided to formatDate:", dateString);
            return undefined;
          }

          // Format to yyyy-MM-dd for database using UTC
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          const day = String(date.getUTCDate()).padStart(2, "0");

          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error("Error formatting date:", error);
          return undefined;
        }
      };

      // Helper function to safely convert string to number
      const safeNumber = (value: any): number | undefined => {
        if (value === "" || value === null || value === undefined)
          return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      // Helper function to clean string values (convert empty strings to undefined)
      const cleanString = (value: string | undefined): string | undefined => {
        if (!value || value.trim() === "") return undefined;
        return value.trim();
      };

      const updateData: UpdateEmployeeDTO = {
        id: employee.id,
        employee_number: data.employee_number,
        first_name: data.first_name,
        middle_name: cleanString(data.middle_name),
        last_name: data.last_name,
        suffix: cleanString(data.suffix),
        sex: data.sex,
        birth_date: formatDate(data.birth_date),
        birth_place: cleanString(data.birth_place),
        civil_status: data.civil_status,
        contact_number: cleanString(data.contact_number),
        email_address: cleanString(data.email_address),
        current_address: cleanString(data.current_address),
        permanent_address: cleanString(data.permanent_address),
        tin: cleanString(data.tin),
        gsis_number: cleanString(data.gsis_number),
        pagibig_number: cleanString(data.pagibig_number),
        philhealth_number: cleanString(data.philhealth_number),
        sss_number: cleanString(data.sss_number),
        appointment_date: data.appointment_date
          ? formatDate(data.appointment_date)!
          : data.appointment_date,
        plantilla_position: cleanString(data.plantilla_position),
        department: cleanString(data.department),
        plantilla_number: cleanString(data.plantilla_number),
        salary_grade: safeNumber(data.salary_grade),
        step_increment: safeNumber(data.step_increment),
        current_daily_rate: safeNumber(data.current_daily_rate),
        employment_status: data.employment_status,
        separation_date: formatDate(data.separation_date),
        separation_reason: cleanString(data.separation_reason),
      };

      await employeeService.updateEmployee(employee.id, updateData);

      // Handle exam certificates
      try {
        const currentCerts = examCertificates || [];
        const origCerts = originalCertificates || [];

        // Find certificates to delete (in original but not in current)
        const certsToDelete = origCerts.filter(
          orig => !currentCerts.find(curr => curr.id === orig.id)
        );

        // Find certificates to add (no id)
        const certsToAdd = currentCerts.filter(cert => !cert.id);

        // Find certificates to update (has id and exists in both)
        const certsToUpdate = currentCerts.filter(cert => 
          cert.id && origCerts.find(orig => orig.id === cert.id)
        );

        // Execute operations
        const operations = [
          ...certsToDelete.filter(cert => cert.id).map(cert => 
            examCertificateService.deleteExamCertificate(cert.id!)
          ),
          ...certsToAdd.map(cert => 
            examCertificateService.createExamCertificate({
              ...cert,
              employee_id: employee.id
            })
          ),
          ...certsToUpdate.filter(cert => cert.id).map(cert => 
            examCertificateService.updateExamCertificate(cert.id!, {
              ...cert,
              id: cert.id!
            })
          )
        ];

        if (operations.length > 0) {
          await Promise.all(operations);
        }
      } catch (certError) {
        console.error('Failed to update exam certificates:', certError);
        showToast.error('Employee updated but some exam certificates failed to save');
      }

      // Handle trainings
      try {
        const { trainingService } = await import('@/services/trainingService');
        const currentTrainings = trainings || [];
        const origTrainings = originalTrainings || [];

        // Find trainings to delete (in original but not in current)
        const trainingsToDelete = origTrainings.filter(
          orig => !currentTrainings.find(curr => curr.id === orig.id)
        );

        // Find trainings to add (no id)
        const trainingsToAdd = currentTrainings.filter(training => !training.id);

        // Find trainings to update (has id and exists in both)
        const trainingsToUpdate = currentTrainings.filter(training => 
          training.id && origTrainings.find(orig => orig.id === training.id)
        );

        // Execute operations
        const trainingOperations = [
          ...trainingsToDelete.filter(training => training.id).map(training => 
            trainingService.deleteTraining(training.id!)
          ),
          ...trainingsToAdd.map(training => 
            trainingService.createTraining({
              ...training,
              employee_id: employee.id
            })
          ),
          ...trainingsToUpdate.filter(training => training.id).map(training => 
            trainingService.updateTraining(training.id!, {
              ...training,
              id: training.id!
            })
          )
        ];

        if (trainingOperations.length > 0) {
          await Promise.all(trainingOperations);
        }
      } catch (trainingError) {
        console.error('Failed to update trainings:', trainingError);
        showToast.error('Employee updated but some trainings failed to save');
      }

      showToast.success("Employee updated successfully");
      navigate("/employees");
    } catch (error) {
      console.error("Failed to update employee:", error);
      showToast.error("Failed to update employee");
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
            <h1 className="text-xl font-semibold tracking-tight">
              Edit Employee
            </h1>
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/employees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="space-y-6"
        >
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic personal details of the employee
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* First Row: 5 fields - Employee ID, First Name, Middle Name, Last Name, Suffix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField
                  control={form.control as any}
                  name="employee_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem>
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
                  control={form.control as any}
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
                  control={form.control as any}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                  control={form.control as any}
                  name="civil_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Civil Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                  control={form.control as any}
                  name="email_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Third Row: 1 field - Birth Place */}
              <div className="grid grid-cols-1">
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            field.onChange(value === "" ? "" : parseFloat(value) || "");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
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
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            field.onChange(value === "" ? "" : parseFloat(value) || "");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                <FormField
                  control={form.control as any}
                  name="citizenship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Citizenship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                    control={form.control as any}
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
              </div>

              {/* Row 4: Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                      control={form.control as any}
                      name="plantilla_position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Software Developer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="IT Department"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Plantilla Number and Appointment Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
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
                      control={form.control as any}
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
                      control={form.control as any}
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
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                if (value === "") {
                                  field.onChange("");
                                } else {
                                  const numValue = parseFloat(value);
                                  field.onChange(
                                    isNaN(numValue) ? "" : numValue
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
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
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                if (value === "") {
                                  field.onChange("");
                                } else {
                                  const numValue = parseInt(value);
                                  field.onChange(
                                    isNaN(numValue) ? "" : numValue
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
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
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                if (value === "") {
                                  field.onChange("");
                                } else {
                                  const numValue = parseInt(value);
                                  field.onChange(
                                    isNaN(numValue) ? "" : numValue
                                  );
                                }
                              }}
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
                      control={form.control as any}
                      name="employment_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "Active"}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Resigned">Resigned</SelectItem>
                              <SelectItem value="Retired">Retired</SelectItem>
                              <SelectItem value="Terminated">
                                Terminated
                              </SelectItem>
                              <SelectItem value="AWOL">AWOL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 5: Separation Date and Reason - Show only when status is not Active */}
                  {(() => {
                    const employmentStatus = form.watch('employment_status');
                    console.log('DEBUG: employment_status value:', employmentStatus, 'type:', typeof employmentStatus);
                    return employmentStatus &&
                      ['Resigned', 'Retired', 'Terminated', 'AWOL'].includes(employmentStatus);
                  })() && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
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
                        control={form.control as any}
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
                    control={form.control as any}
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
                    control={form.control as any}
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
                    control={form.control as any}
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
                    control={form.control as any}
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
                    control={form.control as any}
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
                Training programs and interventions attended
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingProgramMiniManager
                trainings={trainings}
                onChange={setTrainings}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/employees")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Updating..."
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
