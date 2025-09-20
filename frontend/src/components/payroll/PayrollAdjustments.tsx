import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, RefreshCw, Plus, Edit } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { ManualAdjustmentDialog } from './ManualAdjustmentDialog';
import { WorkingDaysAdjustmentDialog } from './WorkingDaysAdjustmentDialog';
import type { PayrollPeriod, PayrollItem, PayrollSummary } from '@/types/payroll';

interface PayrollAdjustmentsProps {
  selectedPeriod: PayrollPeriod;
  summary: PayrollSummary | null;
  onSummaryUpdate: (summary: PayrollSummary) => void;
  onPayrollItemsUpdate: (items: PayrollItem[]) => void;
}

export function PayrollAdjustments({ selectedPeriod, summary, onSummaryUpdate, onPayrollItemsUpdate }: PayrollAdjustmentsProps) {
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrollItems();
  }, [selectedPeriod]);

  const loadPayrollItems = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPayrollItems({ period_id: selectedPeriod.id });
      if (response.success) {
        setPayrollItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load payroll items:', error);
      toast.error('Failed to load payroll items');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingDaysAdjusted = async () => {
    await loadPayrollItems();
    await loadSummary();
    if (onPayrollItemsUpdate) {
      onPayrollItemsUpdate(payrollItems);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await payrollService.getPayrollSummary(selectedPeriod.id);
      if (response.success) {
        onSummaryUpdate(response.data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleAdjustmentAdded = async () => {
    await loadPayrollItems();
    await loadSummary();
    if (onPayrollItemsUpdate) {
      onPayrollItemsUpdate(payrollItems);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading payroll items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.total_gross_pay) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📉</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.total_deductions) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💵</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.total_net_pay) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Payroll Adjustments: {selectedPeriod.year} - {new Date(selectedPeriod.year, selectedPeriod.month - 1).toLocaleString('default', { month: 'long' })} (Period {selectedPeriod.period_number})
              </CardTitle>
              <CardDescription>
                Review and adjust payroll items. Status: {getStatusBadge(selectedPeriod.status)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPayrollItems}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Working Days</TableHead>
                <TableHead>Basic Pay</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{item.employee?.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {item.employee?.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.working_days || 22} days</span>
                      <WorkingDaysAdjustmentDialog
                        payrollItem={item}
                        onAdjustmentComplete={handleWorkingDaysAdjusted}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.basic_pay)}</TableCell>
                  <TableCell>{formatCurrency(item.total_allowances)}</TableCell>
                  <TableCell>{formatCurrency(item.total_deductions)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.net_pay)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ManualAdjustmentDialog
                        payrollItem={item}
                        onAdjustmentAdded={handleAdjustmentAdded}
                        trigger={
                          <Button
                            size="sm"
                            disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payrollItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payroll items found for this period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}