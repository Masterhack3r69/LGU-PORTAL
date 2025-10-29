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

              {/* Second Row: 5 fields - Birth Date, Gender, Civil Status, Email, Contact Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <FormField
                  control={form.control as any}
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
                <FormField
                  control={form.control as any}
                  name="current_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Complete current address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fourth Row: 1 field - Permanent Address */}
              <div className="grid grid-cols-1">
                <FormField
                  control={form.control as any}
                  name="permanent_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Complete permanent address"
                          {...field}
                        />
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

          {/* Exam Certificates */}
          <ExamCertificateManager
            certificates={examCertificates}
            onChange={setExamCertificates}
          />

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
