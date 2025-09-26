import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search,
  Users,
  CheckSquare,
  Square,
  UserCheck,
  Calendar,
  Settings
} from 'lucide-react';
import employeeService from '@/services/employeeService';
import type { Employee } from '@/types/employee';

interface EmployeeSelectionData {
  employee: Employee;
  selected: boolean;
  workingDays: number;
}

interface EmployeeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (employees: EmployeeSelectionData[]) => void;
  initialSelectedEmployees?: EmployeeSelectionData[];
}

export function EmployeeSelectionDialog({
  open,
  onOpenChange,
  onConfirm,
  initialSelectedEmployees = []
}: EmployeeSelectionDialogProps) {
  // Employee Selection States
  const [employees, setEmployees] = useState<EmployeeSelectionData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeSelectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees({
        status: 'active', // Only load active employees
        limit: 1000
      });

      // Filter to ensure only active employees are included
      const activeEmployees = response.employees.filter(employee => 
        employee.status === 'active'
      );

      const employeeData: EmployeeSelectionData[] = activeEmployees.map(employee => {
        // Check if employee was previously selected
        const existingSelection = initialSelectedEmployees.find(
          emp => emp.employee.id === employee.id
        );

        return {
          employee,
          selected: existingSelection?.selected || false,
          workingDays: existingSelection?.workingDays || 22
        };
      });

      setEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load employees:', error);
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
      employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleConfirm = () => {
    const selectedEmployees = getSelectedEmployees();
    onConfirm(selectedEmployees);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const selectedCount = getSelectedCount();
  const selectedEmployees = getSelectedEmployees();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Select Employees for Payroll
          </DialogTitle>
          <DialogDescription>
            Choose employees and configure their working days for payroll processing
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Header with search and select all */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1 max-w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="text-sm w-fit">
                {selectedCount} of {employees.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading}
                className="w-full sm:w-auto"
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

          {/* Employee List */}
          <div className="flex-1 border rounded-lg overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  Loading employees...
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredEmployees.map((empData) => {
                  const originalIndex = employees.findIndex(e => e.employee.id === empData.employee.id);
                  return (
                    <div
                      key={empData.employee.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={empData.selected}
                          onCheckedChange={() => handleEmployeeToggle(originalIndex)}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium truncate">
                              {empData.employee.first_name} {empData.employee.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs w-fit">
                              {empData.employee.employee_number}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {empData.employee.position || 'No position'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        {/* Working Days Display */}
                        {empData.selected && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{empData.workingDays} days</span>
                          </div>
                        )}

                        <Badge variant={empData.employee.status === 'active' ? 'default' : 'secondary'} className="w-fit">
                          {empData.employee.status}
                        </Badge>

                        {/* Actions Column */}
                        {empData.selected && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  const newDays = prompt(`Enter working days for ${empData.employee.first_name} ${empData.employee.last_name} (1-31):`, empData.workingDays.toString());
                                  if (newDays !== null) {
                                    const days = parseInt(newDays);
                                    if (!isNaN(days) && days >= 1 && days <= 31) {
                                      handleWorkingDaysChange(originalIndex, days);
                                    } else {
                                      alert('Please enter a valid number between 1 and 31');
                                    }
                                  }
                                }}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Adjust Working Days
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No employees found matching your search.' : 'No employees available.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Employees Summary */}
          {selectedCount > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                <span className="font-medium">Selected Employees ({selectedCount})</span>
              </div>

              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {selectedEmployees.slice(0, 10).map((empData) => (
                  <div key={empData.employee.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {empData.employee.first_name} {empData.employee.last_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{empData.workingDays} days</span>
                    </div>
                  </div>
                ))}
                {selectedEmployees.length > 10 && (
                  <div className="text-sm text-muted-foreground text-center">
                    ... and {selectedEmployees.length - 10} more
                  </div>
                )}
              </div>

              {/* Working Days Distribution */}
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="font-medium">Working Days Distribution:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.from(new Set(selectedEmployees.map(e => e.workingDays)))
                    .sort((a, b) => b - a)
                    .map(days => {
                      const count = selectedEmployees.filter(e => e.workingDays === days).length;
                      return (
                        <Badge key={days} variant="outline" className="text-xs">
                          {days} days: {count} employee{count !== 1 ? 's' : ''}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedCount === 0}>
            Confirm Selection ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}