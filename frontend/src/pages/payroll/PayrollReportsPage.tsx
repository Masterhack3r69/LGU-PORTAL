import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  Eye,
  DollarSign,
  BarChart,
  Clock
} from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { PayrollPeriod, PayrollItem } from '@/types/payroll';

export function PayrollReportsPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await payrollService.getPeriods();
      if (response.success) {
        // Handle paginated response structure
        const responseData = response.data as { periods?: PayrollPeriod[] } | PayrollPeriod[];
        const periodsData = Array.isArray(responseData) ? responseData : responseData.periods || [];
        setPeriods(Array.isArray(periodsData) ? periodsData : []);
        if (periodsData.length > 0 && !selectedPeriod) {
          setSelectedPeriod(periodsData[0]);
        }
      } else {
        toast.error('Failed to load payroll periods');
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollItems = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollItems({ period_id: periodId });
      if (response.success) {
        setPayrollItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load payroll items:', error);
    }
  };

  const handleGeneratePayslip = async (payrollItemId: number) => {
    try {
      const response = await payrollService.generatePayslipPDF(payrollItemId);

      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payrollItemId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Payslip PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate payslip PDF:', error);
      toast.error('Failed to generate payslip PDF');
    }
  };

  const handleDownloadPayslip = async (payrollItemId: number) => {
    try {
      const response = await payrollService.downloadPayslipAsBase64(payrollItemId);

      if (response.success) {
        const { pdf_data, file_name } = response.data;

        // Convert base64 to blob
        const byteCharacters = atob(pdf_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Payslip downloaded successfully');
      } else {
        toast.error('Failed to download payslip');
      }
    } catch (error) {
      console.error('Failed to download payslip:', error);
      toast.error('Failed to download payslip');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: 'secondary',
      processing: 'default',
      completed: 'outline',
      finalized: 'outline',
      paid: 'destructive',
      open: 'secondary',
      calculating: 'default',
      locked: 'destructive'
    } as const;

    const displayNames: { [key: string]: string } = {
      draft: 'Draft',
      processing: 'Processing',
      completed: 'Completed',
      finalized: 'Finalized',
      paid: 'Paid',
      open: 'Open',
      calculating: 'Calculating',
      locked: 'Locked'
    };

    const displayName = displayNames[statusLower] || status;
    const variant = variants[statusLower as keyof typeof variants] || 'default';

    return <Badge variant={variant}>{displayName}</Badge>;
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const stats = {
    totalPayslips: payrollItems.length,
    totalAmount: payrollItems.reduce((sum, item) => sum + (item.net_pay || 0), 0),
    reportsGenerated: 0, // Placeholder, as summary report is coming soon
    pendingApprovals: payrollItems.filter(item =>
      item.status?.toLowerCase() === 'processing' ||
      item.status?.toLowerCase() === 'calculating'
    ).length
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Payroll Reports</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Generate and download payroll reports and payslips
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Payslips Generated</CardTitle>
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-700">{stats.totalPayslips}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Payroll Amount</CardTitle>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Reports Generated</CardTitle>
              <BarChart className="h-6 w-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-amber-600">{stats.reportsGenerated}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Approvals</CardTitle>
              <Clock className="h-6 w-6 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-600">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Period Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Payroll Period</CardTitle>
            <CardDescription>
              Choose a period to generate reports for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPeriod?.id === period.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      Period {period.period_number} - {period.year}
                    </div>
                    {getStatusBadge(period.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' })}
                  </div>
                  {period.start_date && period.end_date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Net Pay: {period.total_net_pay ? formatCurrency(period.total_net_pay) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports Area */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Reports & Payslips</CardTitle>
            <CardDescription>
              Generate and download payroll reports and employee payslips
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPeriod ? (
              <div className="space-y-6">
                {/* Summary Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Period Summary Report</CardTitle>
                    <CardDescription>
                      Generate a summary report for the selected payroll period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Summary Report
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Summary report functionality coming soon...
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payslip Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Payslips</CardTitle>
                    <CardDescription>
                      Generate and download employee payslips as PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Generate payslips for employees in the selected period
                    </div>

                    {payrollItems.length > 0 ? (
                      <div className="space-y-2">
                        <div className="font-medium">Available Payslips:</div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {payrollItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <div className="font-medium">{item.employee?.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(item.net_pay)} • {getStatusBadge(item.status)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGeneratePayslip(item.id)}
                                  disabled={item.status?.toLowerCase() !== 'processed' && item.status?.toLowerCase() !== 'finalized'}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPayslip(item.id)}
                                  disabled={item.status?.toLowerCase() !== 'processed' && item.status?.toLowerCase() !== 'finalized'}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No payroll items available. Process payroll first.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a payroll period to generate reports.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}