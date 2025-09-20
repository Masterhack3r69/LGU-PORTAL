import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, RefreshCw, Plus, Edit, Users, DollarSign } from 'lucide-react';
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
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
            <div className="text-xl sm:text-2xl font-bold text-red-600">
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
            <div className="text-xl sm:text-2xl font-bold text-green-600">
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
          {/* Mobile View */}
          <div className="block md:hidden space-y-4">
            {payrollItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {item.employee?.full_name}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Working Days:</span>
                      <div className="font-medium">{item.working_days || 22} days</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Basic Pay:</span>
                      <div className="font-medium">{formatCurrency(item.basic_pay)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Allowances:</span>
                      <div className="font-medium text-green-600">+{formatCurrency(item.total_allowances)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deductions:</span>
                      <div className="font-medium text-red-600">-{formatCurrency(item.total_deductions)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Net Pay:</span>
                      <div className="font-bold text-lg">{formatCurrency(item.net_pay)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <WorkingDaysAdjustmentDialog
                      payrollItem={item}
                      onAdjustmentComplete={handleWorkingDaysAdjusted}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Adjust Days
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <ManualAdjustmentDialog
                      payrollItem={item}
                      onAdjustmentAdded={handleAdjustmentAdded}
                      trigger={
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                    <TableCell className="text-green-600">+{formatCurrency(item.total_allowances)}</TableCell>
                    <TableCell className="text-red-600">-{formatCurrency(item.total_deductions)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(item.net_pay)}</TableCell>
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
          </div>

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