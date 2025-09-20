import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  User,
  DollarSign,
  Plus,
  Minus,
  Receipt,
  Clock
} from 'lucide-react';
import type { PayrollItem } from '@/types/payroll';

interface PayrollItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollItem: PayrollItem | null;
}

export function PayrollItemDetailsDialog({
  open,
  onOpenChange,
  payrollItem
}: PayrollItemDetailsDialogProps) {
  if (!payrollItem) return null;

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
      draft: 'default',
      calculated: 'secondary',
      approved: 'outline',
      paid: 'outline',
      processing: 'secondary',
      finalized: 'outline',
      locked: 'destructive'
    } as const;

    return <Badge variant={variants[statusLower as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        aria-describedby="payroll-item-details-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" aria-hidden="true" />
            Payroll Details - {payrollItem.employee?.full_name}
          </DialogTitle>
          <DialogDescription id="payroll-item-details-description">
            Detailed breakdown of payroll calculations and adjustments
          </DialogDescription>
        </DialogHeader>

        {/* Summary Card */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Employee ID</span>
              <span className="font-mono font-medium">{payrollItem.employee?.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Status</span>
              <div className="mt-1">{getStatusBadge(payrollItem.status)}</div>
            </div>
            <div>
              <span className="text-muted-foreground block">Working Days</span>
              <span className="font-medium">{payrollItem.working_days || 22} days</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Net Pay</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(payrollItem.net_pay)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Full Name</label>
                    <p className="text-sm">{payrollItem.employee?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Employee ID</label>
                    <p className="text-sm font-mono">{payrollItem.employee?.id}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Position</label>
                    <p className="text-sm">{payrollItem.employee?.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Department</label>
                    <p className="text-sm">{payrollItem.employee?.department || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Calculation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payroll Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Basic Pay</div>
                    <div className="text-xl font-bold">{formatCurrency(payrollItem.basic_pay)}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Working Days</div>
                    <div className="text-xl font-bold">{payrollItem.working_days || 22} days</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Daily Rate</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(payrollItem.basic_pay / (payrollItem.working_days || 22))}
                    </div>
                  </div>
                </div>

                {/* Earnings vs Deductions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Total Allowances</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(payrollItem.total_allowances)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Minus className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-700 dark:text-red-400">Total Deductions</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(payrollItem.total_deductions)}
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="p-4 border-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-400">Net Pay</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(payrollItem.net_pay)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allowances Details */}
          {payrollItem.allowances && payrollItem.allowances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  Allowances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItem.allowances.map((allowance, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{allowance.allowance_type?.name || 'Allowance'}</TableCell>
                        <TableCell>{allowance.allowance_type?.description || 'Standard allowance'}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(allowance.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Deductions Details */}
          {payrollItem.deductions && payrollItem.deductions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItem.deductions.map((deduction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{deduction.deduction_type?.name || 'Deduction'}</TableCell>
                        <TableCell>{deduction.deduction_type?.description || 'Standard deduction'}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatCurrency(deduction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Created Date</label>
                    <p className="text-sm">{formatDate(payrollItem.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Last Modified</label>
                    <p className="text-sm">{formatDate(payrollItem.updated_at)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Period ID</label>
                    <p className="text-sm font-mono">{payrollItem.period_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">Status</label>
                    <div className="mt-1">{getStatusBadge(payrollItem.status)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}