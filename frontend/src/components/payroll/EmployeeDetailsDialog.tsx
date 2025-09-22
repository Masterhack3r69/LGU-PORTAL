import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  DollarSign,
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