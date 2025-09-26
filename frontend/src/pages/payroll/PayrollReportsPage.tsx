import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showToast } from "@/lib/toast";
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
  const [downloadingItems, setDownloadingItems] = useState<Set<number>>(new Set());

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
        showToast.error('Failed to load payroll periods');
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      showToast.error('Failed to load payroll periods');
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
      setDownloadingItems(prev => new Set(prev).add(payrollItemId));
      
      const response = await payrollService.generatePayslipPDF(payrollItemId);

      // Ensure we have a valid blob
      if (response instanceof Blob && response.size > 0) {
        // Create download link
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${payrollItemId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        showToast.success('Payslip PDF downloaded successfully');
      } else {
        throw new Error(`Invalid PDF response: ${response instanceof Blob ? 'Empty blob' : 'Not a blob'}`);
      }
    } catch (error) {
      showToast.error(`Failed to generate payslip PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(payrollItemId);
        return newSet;
      });
    }
  };

  const handleDownloadPayslip = async (payrollItemId: number) => {
    try {
      setDownloadingItems(prev => new Set(prev).add(payrollItemId));
      
      const response = await payrollService.downloadPayslipAsBase64(payrollItemId);

      if (response.success && response.data) {
        const { pdf_data, file_name } = response.data;

        // Validate base64 data
        if (!pdf_data || pdf_data.length === 0) {
          throw new Error('Empty PDF data received from server');
        }

        // Validate base64 format
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(pdf_data)) {
          throw new Error('Invalid base64 PDF data format');
        }

        try {
          // Convert base64 to blob
          const binaryString = atob(pdf_data);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });

          // Validate blob
          if (blob.size === 0) {
            throw new Error('Generated PDF blob is empty');
          }

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file_name || `payslip_${payrollItemId}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);

          showToast.success('Payslip downloaded successfully');
        } catch (decodeError) {
          showToast.error(`Failed to process PDF data: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
        }
      } else {
        const errorMsg = response.message || 'No data received from server';
        showToast.error(`Failed to download payslip: ${errorMsg}`);
      }
    } catch (error) {
      showToast.error(`Failed to download payslip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(payrollItemId);
        return newSet;
      });
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
      item.status && (
        item.status.toLowerCase() === 'processing' ||
        item.status.toLowerCase() === 'calculating'
      )
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayslips}</div>
            <p className="text-xs text-muted-foreground">generated</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">payroll amount</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <BarChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsGenerated}</div>
            <p className="text-xs text-muted-foreground">this period</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
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
                    {getStatusBadge(period.status || 'Draft')}
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
                                <div className="font-medium">{item.employee?.full_name || 'Unknown Employee'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(item.net_pay || 0)} • {getStatusBadge(item.status || 'Draft')}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGeneratePayslip(item.id)}
                                  disabled={
                                    downloadingItems.has(item.id) ||
                                    (!item.status || (item.status.toLowerCase() !== 'processed' && item.status.toLowerCase() !== 'finalized'))
                                  }
                                >
                                  {downloadingItems.has(item.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-1" />
                                  )}
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPayslip(item.id)}
                                  disabled={
                                    downloadingItems.has(item.id) ||
                                    (!item.status || (item.status.toLowerCase() !== 'processed' && item.status.toLowerCase() !== 'finalized'))
                                  }
                                >
                                  {downloadingItems.has(item.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                                  ) : (
                                    <Eye className="h-4 w-4 mr-1" />
                                  )}
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