import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Printer,
  Download
} from 'lucide-react';
import type { PayrollItem } from '../../types/payroll';

interface PayrollReceiptDialogProps {
  payrollItem: PayrollItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollReceiptDialog({ payrollItem, isOpen, onOpenChange }: PayrollReceiptDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!payrollItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Payroll Receipt
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of payroll for {payrollItem.first_name} {payrollItem.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee and Period Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Employee Information</h3>
              <p className="text-sm text-muted-foreground">
                {payrollItem.first_name} {payrollItem.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Employee #: {payrollItem.employee_number}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Payroll Period</h3>
              <p className="text-sm text-muted-foreground">
                {payrollItem.month && payrollItem.year 
                  ? `${payrollItem.month}/${payrollItem.year}` 
                  : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Period {payrollItem.period_number}
              </p>
            </div>
          </div>

          {/* Earnings */}
          <div className="border rounded-lg">
            <div className="bg-muted px-4 py-2 rounded-t-lg">
              <h3 className="font-semibold">Earnings</h3>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>{formatCurrency(payrollItem.basic_salary)}</span>
              </div>
              <div className="flex justify-between">
                <span>RATA</span>
                <span>{formatCurrency(payrollItem.rata)}</span>
              </div>
              <div className="flex justify-between">
                <span>Clothing Allowance</span>
                <span>{formatCurrency(payrollItem.clothing_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Medical Allowance</span>
                <span>{formatCurrency(payrollItem.medical_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hazard Allowance</span>
                <span>{formatCurrency(payrollItem.hazard_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subsistence & Laundry</span>
                <span>{formatCurrency(payrollItem.subsistence_laundry)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Earnings</span>
                <span>{formatCurrency(payrollItem.gross_pay)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border rounded-lg">
            <div className="bg-muted px-4 py-2 rounded-t-lg">
              <h3 className="font-semibold">Deductions</h3>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span>GSIS Contribution</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.gsis_contribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pag-IBIG Contribution</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.pagibig_contribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>PhilHealth Contribution</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.philhealth_contribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Withheld</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.tax_withheld)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Deductions</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.other_deductions)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span className="text-red-600">-{formatCurrency(payrollItem.total_deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="border rounded-lg bg-green-50">
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Net Pay</h3>
                  <p className="text-sm text-muted-foreground">
                    {payrollItem.days_worked} days worked
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(payrollItem.net_pay)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                Processed Date: {formatDate(payrollItem.created_at)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary">
                {payrollItem.period_status || 'Processed'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}