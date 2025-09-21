import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calculator, Users, DollarSign, BarChart } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { PayrollAdjustments } from '@/components/payroll/PayrollAdjustments';
import type { PayrollPeriod, PayrollSummary, PayrollItem } from '@/types/payroll';

export function PayrollAdjustmentsPage() {
   const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
   const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
   const [summary, setSummary] = useState<PayrollSummary | null>(null);
   const [loading, setLoading] = useState(true);
   const [adjustmentStats, setAdjustmentStats] = useState({
      totalAdjustments: 0,
      employeesWithAdjustments: 0,
      totalAdjustmentAmount: 0,
      adjustmentTypesCount: 0
   });

  useEffect(() => {
    loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.id);
      loadAdjustmentStats(selectedPeriod.id);
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

  const loadSummary = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollSummary(periodId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadAdjustmentStats = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollItems({ period_id: periodId });
      if (response.success) {
        const items: PayrollItem[] = response.data;
        let totalAdjustments = 0;
        let totalAdjustmentAmount = 0;
        const employeesWithAdjustments = new Set<number>();
        const adjustmentTypes = new Set<number>();

        items.forEach(item => {
          if (item.allowances) {
            item.allowances.forEach(allowance => {
              if (allowance.is_override) {
                totalAdjustments++;
                totalAdjustmentAmount += allowance.amount;
                employeesWithAdjustments.add(item.employee_id);
                if (allowance.allowance_type_id) {
                  adjustmentTypes.add(allowance.allowance_type_id);
                }
              }
            });
          }
          if (item.deductions) {
            item.deductions.forEach(deduction => {
              if (deduction.is_override) {
                totalAdjustments++;
                totalAdjustmentAmount += deduction.amount;
                employeesWithAdjustments.add(item.employee_id);
                if (deduction.deduction_type_id) {
                  adjustmentTypes.add(deduction.deduction_type_id);
                }
              }
            });
          }
        });

        setAdjustmentStats({
          totalAdjustments,
          employeesWithAdjustments: employeesWithAdjustments.size,
          totalAdjustmentAmount,
          adjustmentTypesCount: adjustmentTypes.size
        });
      }
    } catch (error) {
      console.error('Failed to load adjustment stats:', error);
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll Adjustments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Make adjustments to payroll items and calculations
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Adjustments Made</CardTitle>
              <Calculator className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-700">{adjustmentStats.totalAdjustments}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Employees with Adjustments</CardTitle>
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600">{adjustmentStats.employeesWithAdjustments}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Adjustment Amount</CardTitle>
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-amber-600">{formatCurrency(adjustmentStats.totalAdjustmentAmount)}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Adjustment Types Breakdown</CardTitle>
              <BarChart className="h-6 w-6 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-600">{adjustmentStats.adjustmentTypesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Period Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Payroll Period</CardTitle>
            <CardDescription>
              Choose a period to make adjustments for
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

        {/* Adjustments Area */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Adjustments</CardTitle>
            <CardDescription>
              Make adjustments to payroll items for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPeriod ? (
              <PayrollAdjustments
                selectedPeriod={selectedPeriod}
                summary={summary}
                onSummaryUpdate={setSummary}
                onPayrollItemsUpdate={() => {}}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a payroll period to make adjustments.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}