import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import payrollService from '@/services/payrollService';
import { EmployeeSelectionProcessing } from '@/components/payroll/EmployeeSelectionProcessing';
import type { PayrollPeriod } from '@/types/payroll';

export function PayrollProcessingPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  // Employee Selection states - commented out for now as functionality is not implemented
  // const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  // const [useEmployeeSelection, setUseEmployeeSelection] = useState(false);

  useEffect(() => {
    loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod) return;

    try {
      // Use selected employees if available, otherwise use all employees
      // For now, process all employees (empty array means all)
      const response = await payrollService.calculatePayroll({
        period_id: selectedPeriod.id,
        employee_ids: undefined
      });

      if (response.success) {
        const processedCount = response.data.processed_count;
        const employeeText = `${processedCount} employees`;

        toast.success(`Processed ${employeeText}`);
        loadPeriods();

        // Reset employee selection after successful processing
        // setSelectedEmployees([]);
      }
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
      toast.error('Failed to calculate payroll');
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll Processing</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Process payroll calculations for employees
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Period Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Payroll Period</CardTitle>
            <CardDescription>
              Choose a period to process payroll for
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Area */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Processing</CardTitle>
            <CardDescription>
              Process payroll calculations for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPeriod ? (
              <EmployeeSelectionProcessing
                selectedPeriod={selectedPeriod}
                onEmployeesSelected={() => {}}
                onCalculatePayroll={handleCalculatePayroll}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a payroll period to begin processing.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}