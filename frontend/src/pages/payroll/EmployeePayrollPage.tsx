import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Download, 
  FileText,
  User,
  Plus,
  Minus
} from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { PayrollPeriod, PayslipData } from '@/types/payroll';
import { useAuth } from '@/contexts/AuthContext';

export function EmployeePayrollPage() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);

  useEffect(() => {
    loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPayslip(parseInt(selectedPeriodId));
    }
  }, [selectedPeriodId]);

  const loadPeriods = async () => {
    try {
      const response = await payrollService.getPeriods();
      if (response.success) {
        // Only show finalized periods to employees
        const finalizedPeriods = response.data.filter(p => p.status === 'finalized');
        setPeriods(finalizedPeriods);
        
        if (finalizedPeriods.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(finalizedPeriods[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const loadPayslip = async (periodId: number) => {
    try {
      setPayslip(null);
      const response = await payrollService.getEmployeePayslip(periodId);
      if (response.success) {
        setPayslip(response.data);
      }
    } catch (error) {
      console.error('Failed to load payslip data:', error);
      toast.error('Failed to load payslip data');
    }
  };

  const handleDownloadPayslip = async () => {
    if (!selectedPeriodId) return;
    
    try {
      setDownloadingPayslip(true);
      const blob = await payrollService.downloadPayslip(parseInt(selectedPeriodId));
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${selectedPeriodId}-${user?.employee_id || 'employee'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('Failed to download payslip:', error);
      toast.error('Failed to download payslip');
    } finally {
      setDownloadingPayslip(false);
    }
  };

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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (periods.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
          <p className="text-muted-foreground">
            View and download your payslips
          </p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Payslips Available</h3>
            <p className="text-muted-foreground text-center">
              There are no finalized payroll periods available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
          <p className="text-muted-foreground">
            View and download your payslips
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select payroll period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id.toString()}>
                  {period.year} - {new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' })} 
                  {' '}(Period {period.period_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {payslip && (
            <Button 
              onClick={handleDownloadPayslip}
              disabled={downloadingPayslip}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadingPayslip ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
        </div>
      </div>

      {payslip ? (
        <div className="space-y-6">
          {/* Payslip Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Payslip for {payslip.period.year} - {new Date(payslip.period.year, payslip.period.month - 1).toLocaleString('default', { month: 'long' })}
                  </CardTitle>
                  <CardDescription>
                    Period {payslip.period.period_number}: {formatDate(payslip.period.start_date)} to {formatDate(payslip.period.end_date)}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {payslip.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                  <p className="text-sm">{payslip.employee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm">{payslip.employee.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{payslip.employee.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Position</p>
                  <p className="text-sm">{payslip.employee.position}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Plus className="h-5 w-5" />
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Basic Pay</span>
                  <span className="font-mono">{formatCurrency(payslip.basic_pay)}</span>
                </div>
                
                {payslip.allowances.map((allowance) => (
                  <div key={allowance.id} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm">{allowance.allowance_type?.name}</span>
                      {allowance.is_override && (
                        <Badge variant="secondary" className="ml-2 text-xs">Override</Badge>
                      )}
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(allowance.amount)}</span>
                  </div>
                ))}
                
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Allowances</span>
                  <span className="font-mono">{formatCurrency(payslip.total_allowances)}</span>
                </div>
                
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Gross Pay</span>
                  <span className="font-mono">{formatCurrency(payslip.gross_pay)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Minus className="h-5 w-5" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {payslip.deductions.map((deduction) => (
                  <div key={deduction.id} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm">{deduction.deduction_type?.name}</span>
                      {deduction.is_override && (
                        <Badge variant="secondary" className="ml-2 text-xs">Override</Badge>
                      )}
                      {deduction.basis && (
                        <p className="text-xs text-muted-foreground">{deduction.basis}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(deduction.amount)}</span>
                  </div>
                ))}
                
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Deductions</span>
                  <span className="font-mono">{formatCurrency(payslip.total_deductions)}</span>
                </div>
                
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Taxes</span>
                  <span className="font-mono">{formatCurrency(payslip.total_taxes)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Pay Summary */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-muted-foreground">Net Pay</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(payslip.net_pay)}
                </p>
                <p className="text-sm text-muted-foreground">
                  For the period {formatDate(payslip.period.start_date)} to {formatDate(payslip.period.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Calculated On</p>
                  <p>{payslip.calculated_at ? formatDate(payslip.calculated_at) : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Approved On</p>
                  <p>{payslip.approved_at ? formatDate(payslip.approved_at) : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Payment Date</p>
                  <p>{payslip.paid_at ? formatDate(payslip.paid_at) : 'Pending'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline">{payslip.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : selectedPeriodId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Payslip Found</h3>
            <p className="text-muted-foreground text-center">
              No payslip data available for the selected period.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}