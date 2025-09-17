import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  RefreshCw, AlertCircle, Eye, 
  Cog, Gift, User, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';
import { payrollSystemService } from '@/services/payrollSystemService';
import type { Employee } from '@/types/employee';
import type { PayrollPeriod } from '@/types/payrollSystem';
import { BenefitsWorkflow } from '@/components/BenefitsWorkflow';

// Types - removed unused interface

export const PayrollSystemPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  // State
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPayrollEmployee, setSelectedPayrollEmployee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'all' | 'individual'>('all');
  const [showEmployeePayrollPreview, setShowEmployeePayrollPreview] = useState(false);

  // Utility functions - removed unused formatCurrency
  
  const formatPeriodName = (period: PayrollPeriod) => 
    `${period.year}-${String(period.month).padStart(2, '0')} Period ${period.period_number}`;
  
  const getStatusColor = (status: string) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CALCULATED': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PAID': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // API Services - using payrollSystemService directly

  // Data loading
  const loadPayrollPeriods = useCallback(async () => {
    if (!isAdmin || !user) return;
    
    try {
      setLoading(true);
      const response = await payrollSystemService.getPayrollPeriods({
        page: 1,
        limit: 50
      });
      setPayrollPeriods(response.data || []);
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401')) {
        toast.error('Authentication required. Please log in again.');
      } else if (errorMessage.includes('403')) {
        toast.error('Access denied. Administrator privileges required.');
      } else {
        toast.error('Failed to load payroll periods.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  }, []);

  // Event handlers  
  const handleGenerateAutomatedPayroll = async (periodId: number, employeeId?: number) => {
    try {
      setActionLoading(`generate-${periodId}`);
      
      const isIndividualProcessing = processingMode === 'individual' && employeeId;
      const targetEmployee = employees.find(emp => emp.id === employeeId);
      const employeeIds = isIndividualProcessing ? [employeeId] : undefined;
      
      const response = await payrollSystemService.generateAutomatedPayroll(periodId, employeeIds);
      if (response.success) {
        const successMessage = isIndividualProcessing && targetEmployee
          ? `🤖 Payroll Generated for ${targetEmployee.first_name} ${targetEmployee.last_name}!`
          : `🤖 Automated Payroll Generated Successfully! ${response.data.payroll_items_created} items created.`;
        
        toast.success(successMessage);
        loadPayrollPeriods();
      } else {
        throw new Error(response.message || 'Failed to generate payroll');
      }
    } catch (error) {
      console.error('Failed to generate automated payroll:', error);
      toast.error('Failed to generate automated payroll');
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-load data when component mounts
  React.useEffect(() => {
    loadPayrollPeriods();
    loadEmployees();
  }, [loadPayrollPeriods, loadEmployees]);

  // Access control
  if (!isAdmin && !isEmployee) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Please log in to access the payroll system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="mr-2 h-6 w-6" />
            Payroll & Compensation Benefits System
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? "Manage automated payroll processing and employee compensation benefits" 
              : "View your payroll information and select compensation benefits"}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">User Role</div>
          <Badge className={isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
            <User className="mr-1 h-3 w-3" />
            {isAdmin ? "Administrator" : "Employee"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? "payroll" : "benefits"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {isAdmin && (
            <TabsTrigger value="payroll">
              <Cog className="mr-2 h-4 w-4" />
              Automated Payroll
            </TabsTrigger>
          )}
          <TabsTrigger value="benefits">
            <Gift className="mr-2 h-4 w-4" />
            Compensation & Benefits
          </TabsTrigger>
        </TabsList>
        
        {/* Automated Payroll Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cog className="mr-2 h-5 w-5" />
                  Automated Payroll Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>How Automated Processing Works</AlertTitle>
                  <AlertDescription>
                    The system automatically calculates salary, deductions, and allowances for all active employees.
                  </AlertDescription>
                </Alert>
                
                {/* Processing Mode Selection */}
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Processing Mode</label>
                    <Select
                      value={processingMode}
                      onValueChange={(value: 'all' | 'individual') => setProcessingMode(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Process All Employees</SelectItem>
                        <SelectItem value="individual">Process Individual Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {processingMode === 'individual' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Select Employee</label>
                      <Select
                        value={selectedPayrollEmployee?.toString() || ''}
                        onValueChange={(value) => setSelectedPayrollEmployee(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose employee to process" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(employee => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.first_name} {employee.last_name} ({employee.employee_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle>Payroll Periods</CardTitle>
                  <Button onClick={loadPayrollPeriods} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading payroll periods...</span>
                  </div>
                ) : payrollPeriods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payroll periods found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollPeriods.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium">
                            {formatPeriodName(period)}
                          </TableCell>
                          <TableCell>
                            {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(period.status)}>
                              {period.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {period.status === 'Draft' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    if (processingMode === 'individual' && !selectedPayrollEmployee) {
                                      toast.error('Please select an employee to process');
                                      return;
                                    }
                                    handleGenerateAutomatedPayroll(period.id, selectedPayrollEmployee || undefined);
                                  }}
                                  disabled={
                                    actionLoading === `generate-${period.id}` || 
                                    (processingMode === 'individual' && !selectedPayrollEmployee)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading === `generate-${period.id}` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Cog className="mr-1 h-4 w-4" />
                                      {processingMode === 'all' ? 'Generate All' : 'Generate Individual'}
                                    </>
                                  )}
                                </Button>
                              )}
                              {period.status !== 'Draft' && (
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Compensation & Benefits Tab */}
        <TabsContent value="benefits" className="space-y-4">
          <BenefitsWorkflow 
            employees={employees}
            isAdmin={isAdmin}
            user={user}
          />
        </TabsContent>
      </Tabs>

      {/* Employee Payroll Preview Dialog - Simplified */}
      <Dialog open={showEmployeePayrollPreview} onOpenChange={setShowEmployeePayrollPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Payroll Preview</DialogTitle>
            <DialogDescription>
              Payroll preview functionality will be implemented
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            Payroll preview feature coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};