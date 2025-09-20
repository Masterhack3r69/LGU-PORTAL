import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Search,
  Users,
  CheckSquare,
  Square,
  UserCheck,
  Calculator,
  DollarSign,
  Play,
  Lock,
  Eye,
  Check
} from 'lucide-react';
import employeeService from '@/services/employeeService';
import payrollService from '@/services/payrollService';
import type { Employee } from '@/types/employee';
import type { PayrollPeriod, PayrollSummary, PayrollItem } from '@/types/payroll';

interface EmployeeSelectionData {
  employee: Employee;
  selected: boolean;
  workingDays: number;
}

interface EmployeeSelectionProcessingProps {
  selectedPeriod: PayrollPeriod | null;
  onEmployeesSelected: (employees: EmployeeSelectionData[]) => void;
  onCalculatePayroll: () => void;
}

export function EmployeeSelectionProcessing({
  selectedPeriod,
  onEmployeesSelected
}: EmployeeSelectionProcessingProps) {
  // Employee Selection States
  const [employees, setEmployees] = useState<EmployeeSelectionData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeSelectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Processing States
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [processingLoading, setProcessingLoading] = useState(false);

  useEffect(() => {
    if (selectedPeriod) {
      loadEmployees();
      loadSummary(selectedPeriod.id);
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  useEffect(() => {
    onEmployeesSelected(employees);
  }, [employees, onEmployeesSelected]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        status: 'active',
        limit: 1000
      });

      const employeeData: EmployeeSelectionData[] = response.employees.map(employee => ({
        employee,
        selected: false,
        workingDays: 22
      }));

      setEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
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

  const filterEmployees = () => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(({ employee }) =>
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredEmployees(filtered);
  };

  const handleEmployeeToggle = (index: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index].selected = !updatedEmployees[index].selected;
    setEmployees(updatedEmployees);
    updateSelectAllState(updatedEmployees);
  };

  const handleWorkingDaysChange = (index: number, workingDays: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index].workingDays = Math.max(1, Math.min(31, workingDays));
    setEmployees(updatedEmployees);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedEmployees = employees.map(emp => ({
      ...emp,
      selected: newSelectAll
    }));
    setEmployees(updatedEmployees);
  };

  const updateSelectAllState = (employeeList: EmployeeSelectionData[]) => {
    const selectedCount = employeeList.filter(emp => emp.selected).length;
    setSelectAll(selectedCount === employeeList.length && employeeList.length > 0);
  };

  const getSelectedCount = () => {
    return employees.filter(emp => emp.selected).length;
  };

  const getSelectedEmployees = () => {
    return employees.filter(emp => emp.selected);
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod) return;

    setProcessingLoading(true);
    try {
      if (selectedEmployees.length > 0) {
        selectedEmployees.map(emp => ({
          employee_id: emp.employee.id,
          working_days: emp.workingDays
        }));
      }

      const response = await payrollService.calculatePayroll({
        period_id: selectedPeriod.id,
        employee_ids: selectedEmployees.length > 0
          ? selectedEmployees.map(emp => emp.employee.id)
          : undefined
      });

      if (response.success) {
        const processedCount = response.data.processed_count;
        const employeeText = selectedEmployees.length > 0
          ? `${processedCount} selected employees`
          : `${processedCount} employees`;

        toast.success(`Processed ${employeeText}`);
        loadSummary(selectedPeriod.id);
        loadPayrollItems(selectedPeriod.id);
      }
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
      toast.error('Failed to calculate payroll');
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleFinalizePeriod = async () => {
    if (!selectedPeriod) return;

    try {
      const response = await payrollService.finalizePeriod(selectedPeriod.id);
      if (response.success) {
        toast.success('Payroll period finalized');
        loadSummary(selectedPeriod.id);
        loadPayrollItems(selectedPeriod.id);
      }
    } catch (error) {
      console.error('Failed to finalize payroll period:', error);
      toast.error('Failed to finalize payroll period');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: 'default',
      processing: 'secondary',
      completed: 'outline',
      finalized: 'outline',
      paid: 'outline',
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading employees...</div>;
  }

  const selectedCount = getSelectedCount();
  const selectedEmployees = getSelectedEmployees();

  return (
    <div className="space-y-6">
      {/* Processing Summary Cards */}
      {selectedPeriod && summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_employees || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.total_net_pay) : '-'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Employee Selection & Processing
              </CardTitle>
              <CardDescription>
                Select employees and set custom working days for payroll processing
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {selectedCount} of {employees.length} selected
              </Badge>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
              >
                {selectAll ? (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Select All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Employees</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, employee ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Working Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((empData) => {
                const originalIndex = employees.findIndex(e => e.employee.id === empData.employee.id);
                return (
                  <TableRow key={empData.employee.id}>
                    <TableCell>
                      <Checkbox
                        checked={empData.selected}
                        onCheckedChange={() => handleEmployeeToggle(originalIndex)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {empData.employee.first_name} {empData.employee.last_name}
                    </TableCell>
                    <TableCell>{empData.employee.employee_number}</TableCell>
                    <TableCell>{empData.employee.department || 'N/A'}</TableCell>
                    <TableCell>{empData.employee.position || 'N/A'}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={empData.workingDays}
                        onChange={(e) => handleWorkingDaysChange(originalIndex, parseInt(e.target.value) || 22)}
                        className="w-20"
                        disabled={!empData.selected}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={empData.employee.status === 'active' ? 'default' : 'secondary'}>
                        {empData.employee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No employees found matching your search.' : 'No employees available.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Employees Summary */}
      {selectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Employees Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Selected Employees ({selectedCount})</Label>
                <div className="mt-2 space-y-1">
                  {selectedEmployees.slice(0, 5).map((empData) => (
                    <div key={empData.employee.id} className="flex items-center justify-between text-sm">
                      <span>{empData.employee.first_name} {empData.employee.last_name}</span>
                      <Badge variant="outline">{empData.workingDays} days</Badge>
                    </div>
                  ))}
                  {selectedEmployees.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {selectedEmployees.length - 5} more
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Working Days Distribution</Label>
                <div className="mt-2 space-y-1">
                  {Array.from(new Set(selectedEmployees.map(e => e.workingDays)))
                    .sort((a, b) => b - a)
                    .map(days => {
                      const count = selectedEmployees.filter(e => e.workingDays === days).length;
                      return (
                        <div key={days} className="flex items-center justify-between text-sm">
                          <span>{days} working days</span>
                          <Badge variant="outline">{count} employees</Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="flex gap-2">
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
                {(selectedPeriod.status?.toLowerCase() === 'processing' || selectedPeriod.status?.toLowerCase() === 'calculating') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={processingLoading}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
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
                    <TableCell>{item.employee?.department}</TableCell>
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
                        {(item.status?.toLowerCase() === 'calculated' || item.status?.toLowerCase() === 'processed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => payrollService.approvePayrollItem(item.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}