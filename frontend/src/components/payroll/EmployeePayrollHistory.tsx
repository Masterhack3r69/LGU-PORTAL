import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, Calendar, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { payrollService } from '@/services/payrollService';
import { employeeService } from '@/services/employeeService';
import type { PayrollItem, PayrollHistoryFilters } from '@/types/payroll';
import type { Employee } from '@/types/employee';

interface EmployeePayrollHistoryProps {
  employeeId?: number; // If provided, shows specific employee's payroll
}

export const EmployeePayrollHistory: React.FC<EmployeePayrollHistoryProps> = ({ employeeId: propEmployeeId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // State management
  const [payrollHistory, setPayrollHistory] = useState<PayrollItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<PayrollHistoryFilters>({
    year: new Date().getFullYear(),
    limit: 50
  });

  // Determine effective employee ID - enforce access control
  const effectiveEmployeeId = (() => {
    if (propEmployeeId) {
      // If specific employee ID is provided, only admin can access any employee
      return isAdmin ? propEmployeeId : (propEmployeeId === user?.employee_id ? propEmployeeId : null);
    }
    
    if (isAdmin && selectedEmployee?.id) {
      return selectedEmployee.id;
    }
    
    // Employees can only access their own payroll (use employee_id, not user.id)
    return user?.employee_id || null;
  })();

  // Load employees for admin
  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getEmployees({ limit: 100 });
      setEmployees(response.employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  }, [isAdmin]);

  // Load payroll history
  const loadPayrollHistory = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    
    try {
      setLoading(true);
      const response = await payrollService.getEmployeePayrollHistory(effectiveEmployeeId, filters);
      setPayrollHistory(response.data);
    } catch (error) {
      console.error('Failed to load payroll history:', error);
      toast.error('Failed to load payroll history');
    } finally {
      setLoading(false);
    }
  }, [effectiveEmployeeId, filters]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadPayrollHistory();
  }, [loadPayrollHistory]);

  // Handle employee selection
  const handleEmployeeSelection = (employeeId: string) => {
    if (employeeId === 'all') {
      setSelectedEmployee(null);
      return;
    }
    
    const employee = employees.find(emp => emp.id.toString() === employeeId);
    setSelectedEmployee(employee || null);
  };

  // Calculate totals
  const totals = payrollHistory.reduce(
    (acc, item) => ({
      grossPay: acc.grossPay + item.gross_pay,
      deductions: acc.deductions + item.total_deductions,
      netPay: acc.netPay + item.net_pay,
    }),
    { grossPay: 0, deductions: 0, netPay: 0 }
  );

  const currentEmployee = selectedEmployee || (user?.employee_id ? { 
    id: user.employee_id, 
    first_name: user.full_name.split(' ')[0] || '', 
    last_name: user.full_name.split(' ').slice(1).join(' ') || '',
    employee_number: 'EMP-' + user.employee_id.toString().padStart(4, '0')
  } as Employee : null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'Employee Payroll History' : 'My Payroll History'}
          </h2>
          <p className="text-gray-600">
            {currentEmployee ? 
              `Payroll history for ${currentEmployee.first_name} ${currentEmployee.last_name} (${currentEmployee.employee_number})` :
              'View detailed payroll information and payment history'
            }
          </p>
        </div>
        <Button variant="outline" onClick={loadPayrollHistory} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {payrollHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Pay Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollHistory.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Total Gross
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollService.formatCurrency(totals.grossPay)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{payrollService.formatCurrency(totals.deductions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Total Net Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{payrollService.formatCurrency(totals.netPay)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdmin && !propEmployeeId && (
              <div>
                <Label>Employee</Label>
                <Select
                  value={selectedEmployee?.id.toString() || 'all'}
                  onValueChange={handleEmployeeSelection}
                  disabled={employeesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.first_name} {employee.last_name} ({employee.employee_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Year</Label>
              <Select
                value={filters.year?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  year: value === 'all' ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Limit</Label>
              <Select
                value={filters.limit?.toString() || '50'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  limit: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                  <SelectItem value="200">200 records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center">
              <User className="mr-2 h-4 w-4" />
              Payroll History
            </CardTitle>
            {payrollHistory.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!effectiveEmployeeId ? (
            <div className="text-center py-8 text-gray-500">
              {isAdmin ? 'Please select an employee to view payroll history' : 'No employee data available'}
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading payroll history...</span>
            </div>
          ) : payrollHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payroll records found for the selected criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Days Worked</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollHistory.map((item) => {
                  const allowances = item.rata + item.clothing_allowance + item.medical_allowance + 
                                   item.hazard_allowance + item.subsistence_laundry;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">
                          Period {item.payroll_period_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium">{item.days_worked}</span>
                          <span className="text-gray-500 ml-1">/22</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payrollService.formatCurrency(item.basic_salary)}
                      </TableCell>
                      <TableCell>
                        {payrollService.formatCurrency(allowances)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payrollService.formatCurrency(item.gross_pay)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {payrollService.formatCurrency(item.total_deductions)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {payrollService.formatCurrency(item.net_pay)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};