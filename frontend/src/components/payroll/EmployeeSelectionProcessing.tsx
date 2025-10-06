import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showToast } from "@/lib/toast"
import {
  Users,
  Calculator,
  Play,
  Lock,
  Eye,
  UserPlus
} from 'lucide-react';
import payrollService from '@/services/payrollService';
import employeeService from '@/services/employeeService';
import { EmployeeSelectionDialog } from './EmployeeSelectionDialog';
import { EmployeeDetailsDialog } from './EmployeeDetailsDialog';
import type { Employee } from '@/types/employee';
import type { PayrollPeriod, PayrollItem } from '@/types/payroll';

interface EmployeeSelectionData {
  employee: Employee;
  selected: boolean;
  workingDays: number;
}

interface EmployeeSelectionProcessingProps {
  selectedPeriod: PayrollPeriod | null;
  onEmployeesSelected: (employees: EmployeeSelectionData[]) => void;
  onCalculatePayroll: () => void;
  onPeriodUpdate?: () => void;
}

export function EmployeeSelectionProcessing({
  selectedPeriod,
  onEmployeesSelected,
  onPeriodUpdate
}: EmployeeSelectionProcessingProps) {
  // Employee Selection States
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeSelectionData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Employee Details Dialog States
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<Employee | null>(null);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(null);

  // Processing States
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [processingLoading, setProcessingLoading] = useState(false);

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    onEmployeesSelected(selectedEmployees);
  }, [selectedEmployees, onEmployeesSelected]);

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

  const handleEmployeeSelection = (employees: EmployeeSelectionData[]) => {
    setSelectedEmployees(employees);
  };

  const handleViewEmployeeDetails = async (employeeId: number, payrollItem?: PayrollItem) => {
    try {
      // Fetch full employee details using the employee service
      const employee = await employeeService.getEmployee(employeeId);
      setSelectedEmployeeDetails(employee);
      setSelectedPayrollItem(payrollItem || null);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
      showToast.error('Failed to load employee details');
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod) return;

    setProcessingLoading(true);
    try {
      // Prepare employee data with working days
      const employeesData = selectedEmployees.length > 0 
        ? selectedEmployees.map(emp => ({
            employee_id: emp.employee.id,
            working_days: emp.workingDays
          }))
        : []; // Empty array means process all employees with default working days

      const response = await payrollService.calculatePayroll({
        period_id: selectedPeriod.id,
        employee_ids: selectedEmployees.length > 0
          ? selectedEmployees.map(emp => emp.employee.id)
          : undefined,
        employees_data: employeesData // Pass working days data
      });

      if (response.success) {
        const processedCount = response.data.processed_count;
        const employeeText = selectedEmployees.length > 0
          ? `${processedCount} selected employees`
          : `${processedCount} employees`;

        showToast.success(`Processed ${employeeText}`);
        await loadPayrollItems(selectedPeriod.id);
        // Refresh the period data to update status
        if (onPeriodUpdate) {
          onPeriodUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
      showToast.error('Failed to calculate payroll');
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleFinalizePeriod = async () => {
    if (!selectedPeriod) return;

    try {
      const response = await payrollService.finalizePeriod(selectedPeriod.id);
      if (response.success) {
        showToast.success('Payroll period finalized');
        await loadPayrollItems(selectedPeriod.id);
        // Refresh the period data to update status and hide the button
        if (onPeriodUpdate) {
          onPeriodUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to finalize payroll period:', error);
      showToast.error('Failed to finalize payroll period');
    }
  };

  const handleFinalizePayrollItem = async (payrollItemId: number) => {
    try {
      const response = await payrollService.approvePayrollItem(payrollItemId);
      if (response.success) {
        showToast.success('Payroll item finalized');
        await loadPayrollItems(selectedPeriod!.id);
        // Refresh the period data
        if (onPeriodUpdate) {
          onPeriodUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to finalize payroll item:', error);
      showToast.error('Failed to finalize payroll item');
    }
  };

  const handleMarkAsPaid = async (payrollItemId: number) => {
    try {
      const response = await payrollService.markAsPaid(payrollItemId);
      if (response.success) {
        showToast.success('Payroll item marked as paid');
        await loadPayrollItems(selectedPeriod!.id);
        // Refresh the period data
        if (onPeriodUpdate) {
          onPeriodUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to mark payroll item as paid:', error);
      showToast.error('Failed to mark payroll item as paid');
    }
  };

  const handleBulkFinalize = async () => {
    if (!selectedPeriod) return;

    const processedItems = payrollItems.filter(item => item.status?.toLowerCase() === 'processed');
    if (processedItems.length === 0) {
      showToast.error('No processed items to finalize');
      return;
    }

    try {
      const promises = processedItems.map(item => payrollService.approvePayrollItem(item.id));
      await Promise.all(promises);
      showToast.success(`Finalized ${processedItems.length} payroll items`);
      await loadPayrollItems(selectedPeriod.id);
      // Refresh the period data
      if (onPeriodUpdate) {
        onPeriodUpdate();
      }
    } catch (error) {
      console.error('Failed to bulk finalize payroll items:', error);
      showToast.error('Failed to bulk finalize payroll items');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (!selectedPeriod) return;

    const finalizedItems = payrollItems.filter(item => item.status?.toLowerCase() === 'finalized');
    if (finalizedItems.length === 0) {
      showToast.error('No finalized items to mark as paid');
      return;
    }

    try {
      const promises = finalizedItems.map(item => payrollService.markAsPaid(item.id));
      await Promise.all(promises);
      showToast.success(`Marked ${finalizedItems.length} payroll items as paid`);
      await loadPayrollItems(selectedPeriod.id);
      // Refresh the period data
      if (onPeriodUpdate) {
        onPeriodUpdate();
      }
    } catch (error) {
      console.error('Failed to bulk mark as paid:', error);
      showToast.error('Failed to bulk mark as paid');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: 'default',
      processing: 'secondary',
      processed: 'secondary',
      completed: 'outline',
      finalized: 'outline',
      paid: 'destructive',
      open: 'default',
      calculating: 'secondary',
      locked: 'destructive'
    } as const;

    return <Badge variant={variants[statusLower as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
                {selectedEmployees.length} employees selected
              </Badge>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setDialogOpen(true)}
                variant="default"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Select Employees
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No employees selected</p>
              <p className="text-sm">Click "Select Employees" to choose employees for payroll processing</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-3">Selected Employees ({selectedEmployees.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedEmployees.map((empData) => (
                      <div key={empData.employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {empData.employee.first_name} {empData.employee.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {empData.employee.employee_number}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{empData.workingDays} days</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEmployeeDetails(empData.employee.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Working Days Distribution</h4>
                  <div className="space-y-2">
                    {Array.from(new Set(selectedEmployees.map(e => e.workingDays)))
                      .sort((a, b) => b - a)
                      .map(days => {
                        const count = selectedEmployees.filter(e => e.workingDays === days).length;
                        return (
                          <div key={days} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">{days} working days</span>
                            <Badge variant="outline">{count} employees</Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Actions */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Processing: {selectedPeriod.year} - {new Date(selectedPeriod.year, selectedPeriod.month - 1).toLocaleString('default', { month: 'long' })} (Period {selectedPeriod.period_number})
                </CardTitle>
                <CardDescription>
                  Status: {getStatusBadge(selectedPeriod.status)}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(selectedPeriod.status?.toLowerCase() === 'draft' || selectedPeriod.status?.toLowerCase() === 'open') && (
                  <>
                    <Button
                      variant={selectedEmployees.length > 0 ? "default" : "outline"}
                      onClick={handleCalculatePayroll}
                      disabled={processingLoading}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {selectedEmployees.length > 0 ? 'Process Selected' : 'Process All'}
                    </Button>
                  </>
                )}
                
                {/* Bulk Actions for Processed Items */}
                {payrollItems.filter(item => item.status?.toLowerCase() === 'processed').length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkFinalize}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Finalize All ({payrollItems.filter(item => item.status?.toLowerCase() === 'processed').length})
                  </Button>
                )}
                
                {/* Bulk Actions for Finalized Items */}
                {payrollItems.filter(item => item.status?.toLowerCase() === 'finalized').length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkMarkAsPaid}
                  >
                    Mark All Paid ({payrollItems.filter(item => item.status?.toLowerCase() === 'finalized').length})
                  </Button>
                )}

                {(selectedPeriod.status?.toLowerCase() === 'processing' || 
                  selectedPeriod.status?.toLowerCase() === 'completed' ||
                  selectedPeriod.status?.toLowerCase() === 'processed') && 
                  selectedPeriod.status?.toLowerCase() !== 'finalized' && 
                  selectedPeriod.status?.toLowerCase() !== 'paid' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={processingLoading} variant="outline">
                        <Lock className="mr-2 h-4 w-4" />
                        Finalize Period
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Finalize Payroll Period</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will finalize the payroll period and prevent further modifications. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalizePeriod}>
                          Finalize
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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
                      <div>
                        <span className="text-muted-foreground">Net Pay:</span>
                        <div className="font-bold text-lg">{formatCurrency(item.net_pay)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewEmployeeDetails(item.employee?.id || 0, item)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {item.status?.toLowerCase() === 'processed' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleFinalizePayrollItem(item.id)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Finalize
                        </Button>
                      )}
                      {item.status?.toLowerCase() === 'finalized' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleMarkAsPaid(item.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
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
                        {item.employee?.full_name}
                      </TableCell>
                      <TableCell>{formatCurrency(item.basic_pay)}</TableCell>
                      <TableCell className="text-green-600">+{formatCurrency(item.total_allowances)}</TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(item.total_deductions)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(item.net_pay)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEmployeeDetails(item.employee?.id || 0, item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status?.toLowerCase() === 'processed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleFinalizePayrollItem(item.id)}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          {item.status?.toLowerCase() === 'finalized' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleMarkAsPaid(item.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Selection Dialog */}
      <EmployeeSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleEmployeeSelection}
        initialSelectedEmployees={selectedEmployees}
      />

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        employee={selectedEmployeeDetails}
        payrollItem={selectedPayrollItem}
      />
    </div>
  );
}