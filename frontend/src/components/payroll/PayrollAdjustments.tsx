import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { RefreshCw, Plus, Edit, MoreHorizontal, Eye, Calendar, Settings } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { ManualAdjustmentDialog } from './ManualAdjustmentDialog';
import { WorkingDaysAdjustmentDialog } from './WorkingDaysAdjustmentDialog';
import { PayrollItemDetailsDialog } from './PayrollItemDetailsDialog';
import type { PayrollPeriod, PayrollItem, PayrollSummary } from '@/types/payroll';

interface PayrollAdjustmentsProps {
  selectedPeriod: PayrollPeriod;
  summary: PayrollSummary | null;
  onSummaryUpdate: (summary: PayrollSummary) => void;
  onPayrollItemsUpdate: (items: PayrollItem[]) => void;
}

export function PayrollAdjustments({ selectedPeriod, onSummaryUpdate, onPayrollItemsUpdate }: PayrollAdjustmentsProps) {
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<PayrollItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadPayrollItems();
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleViewDetails = (item: PayrollItem) => {
    setSelectedItemForDetails(item);
    setShowDetailsDialog(true);
  };

  const handleChangeWorkingDays = (item: PayrollItem) => {
    toast.info(`Use the edit button next to working days for ${item.employee?.full_name}`);
  };

  const handleManualAdjustment = (item: PayrollItem) => {
    toast.info(`Use the Manual button to add manual adjustments for ${item.employee?.full_name}`);
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
                    <div className="flex-1">
                      <WorkingDaysAdjustmentDialog
                        payrollItem={item}
                        onAdjustmentComplete={handleWorkingDaysAdjusted}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Adjust Days
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <ManualAdjustmentDialog
                        payrollItem={item}
                        onAdjustmentAdded={handleAdjustmentAdded}
                        trigger={
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Manual
                          </Button>
                        }
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleChangeWorkingDays(item)}
                          disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Change Working Days
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleManualAdjustment(item)}
                          disabled={item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid'}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Manual Adjustment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      <span className="font-medium">{item.working_days || 22} days</span>
                    </TableCell>
                    <TableCell>{formatCurrency(item.basic_pay)}</TableCell>
                    <TableCell className="text-green-600">+{formatCurrency(item.total_allowances)}</TableCell>
                    <TableCell className="text-red-600">-{formatCurrency(item.total_deductions)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(item.net_pay)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <WorkingDaysAdjustmentDialog
                              payrollItem={item}
                              onAdjustmentComplete={handleWorkingDaysAdjusted}
                              trigger={
                                <div className="flex items-center w-full cursor-pointer px-2 py-1.5 text-sm" 
                                     style={{ pointerEvents: item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid' ? 'none' : 'auto',
                                             opacity: item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid' ? 0.5 : 1 }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Adjust Working Days
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <ManualAdjustmentDialog
                              payrollItem={item}
                              onAdjustmentAdded={handleAdjustmentAdded}
                              trigger={
                                <div className="flex items-center w-full cursor-pointer px-2 py-1.5 text-sm"
                                     style={{ pointerEvents: item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid' ? 'none' : 'auto',
                                             opacity: item.status?.toLowerCase() === 'finalized' || item.status?.toLowerCase() === 'paid' ? 0.5 : 1 }}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Manual Adjustment
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* PayrollItemDetailsDialog */}
      <PayrollItemDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        payrollItem={selectedItemForDetails}
      />
    </div>
  );
}