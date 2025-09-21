import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  CheckSquare,
  Square,
  UserCheck
} from 'lucide-react';
import employeeService from '@/services/employeeService';
import type { Employee } from '@/types/employee';

interface EmployeeSelectionData {
  employee: Employee;
  selected: boolean;
  workingDays: number;
}

interface EmployeeSelectionProps {
  selectedPeriod?: string | null;
  onEmployeesSelected: (employees: EmployeeSelectionData[]) => void;
  onCalculatePayroll?: () => void;
}

export function EmployeeSelection({ onEmployeesSelected }: EmployeeSelectionProps) {
  const [employees, setEmployees] = useState<EmployeeSelectionData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeSelectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onEmployeesSelected(employees);
  }, [employees, onEmployeesSelected]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        status: 'active',
        limit: 1000 // Get all active employees
      });

      const employeeData: EmployeeSelectionData[] = response.employees.map(employee => ({
        employee,
        selected: false,
        workingDays: 22 // Default working days
      }));

      setEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading employees...</div>;
  }

  const selectedCount = getSelectedCount();
  const selectedEmployees = getSelectedEmployees();

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Employee Selection
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
    </div>
  );
}