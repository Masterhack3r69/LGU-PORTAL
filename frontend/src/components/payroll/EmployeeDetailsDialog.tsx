import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  Briefcase,
  CreditCard,
  FileText
} from 'lucide-react';
import type { Employee } from '@/types/employee';
import type { PayrollItem } from '@/types/payroll';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  payrollItem?: PayrollItem | null;
}

export function EmployeeDetailsDialog({
  open,
  onOpenChange,
  employee,
  payrollItem
}: EmployeeDetailsDialogProps) {
  if (!employee) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      active: 'default',
      inactive: 'secondary',
      resigned: 'destructive',
      retired: 'outline',
      terminated: 'destructive',
      awol: 'destructive'
    } as const;

    return <Badge variant={variants[statusLower as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="employee-details-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" aria-hidden="true" />
            Employee Details
          </DialogTitle>
          <DialogDescription id="employee-details-description">
            Comprehensive information for {employee.first_name} {employee.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Info Bar */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Employee ID</span>
              <span className="font-mono font-medium">{employee.employee_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Status</span>
              <div className="mt-1">{getStatusBadge(employee.employment_status)}</div>
            </div>
            <div>
              <span className="text-muted-foreground block">Position</span>
              <span className="font-medium">{employee.plantilla_position || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Monthly Salary</span>
              <span className="font-medium">{employee.current_monthly_salary ? formatCurrency(employee.current_monthly_salary) : 'Not specified'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Full Name</label>
                    <p className="text-sm break-words">
                      {employee.first_name} {employee.middle_name} {employee.last_name} {employee.suffix}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Employee Number</label>
                    <p className="text-sm font-mono break-all">{employee.employee_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Date of Birth</label>
                    <p className="text-sm">{formatDate(employee.birth_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Place of Birth</label>
                    <p className="text-sm break-words">{employee.birth_place || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Gender</label>
                    <p className="text-sm">{employee.sex || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Civil Status</label>
                    <p className="text-sm">{employee.civil_status || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Employment Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(employee.employment_status)}
                    </div>
                  </div>
                  {employee.separation_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block">Separation Date</label>
                      <p className="text-sm">{formatDate(employee.separation_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Phone Number</label>
                    <p className="text-sm break-all">{employee.contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Email Address</label>
                    <p className="text-sm break-all">{employee.email_address || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Current Address</label>
                    <p className="text-sm break-words">{employee.current_address || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Permanent Address</label>
                    <p className="text-sm break-words">{employee.permanent_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Position</label>
                    <p className="text-sm break-words">{employee.plantilla_position || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Department</label>
                    <p className="text-sm break-words">{employee.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Appointment Date</label>
                    <p className="text-sm">{formatDate(employee.appointment_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Plantilla Number</label>
                    <p className="text-sm break-all">{employee.plantilla_number || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Salary Grade</label>
                    <p className="text-sm">{employee.salary_grade || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Step Increment</label>
                    <p className="text-sm">{employee.step_increment || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Monthly Salary</label>
                    <p className="text-sm font-medium">
                      {employee.current_monthly_salary ? formatCurrency(employee.current_monthly_salary) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Daily Rate</label>
                    <p className="text-sm">
                      {employee.current_daily_rate ? formatCurrency(employee.current_daily_rate) : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Government IDs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Government IDs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">TIN</label>
                    <p className="text-sm font-mono break-all">{employee.tin || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">SSS Number</label>
                    <p className="text-sm font-mono break-all">{employee.sss_number || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">GSIS Number</label>
                    <p className="text-sm font-mono break-all">{employee.gsis_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">PhilHealth Number</label>
                    <p className="text-sm font-mono break-all">{employee.philhealth_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Pag-IBIG Number</label>
                    <p className="text-sm font-mono break-all">{employee.pagibig_number || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Information */}
          {payrollItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Current Payroll Information
                </CardTitle>
                <CardDescription>
                  Payroll details for the current period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Basic Pay</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(payrollItem.basic_pay)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Total Allowances</label>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(payrollItem.total_allowances)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Total Deductions</label>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(payrollItem.total_deductions)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Gross Pay</label>
                    <p className="text-sm font-medium">
                      {formatCurrency(payrollItem.gross_pay)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Total Taxes</label>
                    <p className="text-sm font-medium">
                      {formatCurrency(payrollItem.total_taxes)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Net Pay</label>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(payrollItem.net_pay)}
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium text-muted-foreground block">Working Days</label>
                    <p className="text-sm">{payrollItem.working_days || 'Not specified'} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block">Created At</label>
                  <p className="text-sm">{formatDate(employee.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block">Last Updated</label>
                  <p className="text-sm">{formatDate(employee.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}