import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  Search,
  Plus,
  User,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import leaveService from "@/services/leaveService";
import employeeService from "@/services/employeeService";
import LeaveBalanceCard from "./LeaveBalanceCard";
import { showToast } from "@/lib/toast"
import type {
  LeaveBalance,
  LeaveType,
  CreateLeaveBalanceDTO,
} from "@/types/leave";
import type { Employee } from "@/types/employee";

const AdminLeaveBalances: React.FC = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Combobox state
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  const [mainEmployeeComboboxOpen, setMainEmployeeComboboxOpen] =
    useState(false);
  const [mainEmployeeSearchValue, setMainEmployeeSearchValue] = useState("");

  // Form state for adding new balance
  const [addBalanceForm, setAddBalanceForm] = useState<CreateLeaveBalanceDTO>({
    employee_id: 0,
    leave_type_id: 0,
    year: new Date().getFullYear(),
    earned_days: 0,
    carried_forward: 0,
    reason: "",
  });

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 1,
        limit: 1000,
      });
      setEmployees(
        response.employees.filter((emp) => emp.employment_status === "Active")
      );
    } catch (error) {
      console.error("Error loading employees:", error);
      showToast.error("Failed to load employees");
    }
  }, []);

  const loadLeaveTypes = useCallback(async () => {
    try {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    } catch (error) {
      console.error("Error loading leave types:", error);
      showToast.error("Failed to load leave types");
    }
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      if (selectedEmployee && selectedEmployee !== "all") {
        const data = await leaveService.getLeaveBalances(
          parseInt(selectedEmployee),
          selectedYear
        );
        setBalances(data);
      } else {
        // For admin view, we'd need an endpoint to get all employee balances
        // For now, we'll show empty state
        setBalances([]);
      }
    } catch (error) {
      showToast.error("Failed to load leave balances");
      console.error("Error loading balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployee, selectedYear]);

  useEffect(() => {
    loadEmployees();
    loadLeaveTypes();
    loadBalances();
  }, [loadEmployees, loadLeaveTypes, loadBalances]);

  const selectedEmployeeData = employees.find(
    (emp) =>
      emp.id.toString() === selectedEmployee && selectedEmployee !== "all"
  );

  // Helper function to get employee full name
  const getEmployeeFullName = (employee: Employee) => {
    const parts = [
      employee.first_name,
      employee.middle_name,
      employee.last_name,
      employee.suffix,
    ].filter(Boolean);
    return parts.join(" ");
  };

  // Filter employees based on search value
  const filteredEmployees = employees.filter((employee) => {
    const fullName = getEmployeeFullName(employee);
    const searchTerm = employeeSearchValue.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchTerm) ||
      employee.employee_number?.toLowerCase().includes(searchTerm)
    );
  });

  // Filter employees for main selection
  const filteredMainEmployees = employees.filter((employee) => {
    const fullName = getEmployeeFullName(employee);
    const searchTerm = mainEmployeeSearchValue.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchTerm) ||
      employee.employee_number?.toLowerCase().includes(searchTerm)
    );
  });

  const handleCreateBalance = async () => {
    if (addBalanceForm.employee_id === 0) {
      showToast.error("Please select an employee");
      return;
    }

    if (addBalanceForm.leave_type_id === 0) {
      showToast.error("Please select a leave type");
      return;
    }

    if (addBalanceForm.earned_days < 0) {
      showToast.error("Earned days cannot be negative");
      return;
    }

    try {
      setIsCreating(true);
      await leaveService.createLeaveBalance(addBalanceForm);
      showToast.success("Leave balance created successfully");
      setShowAddDialog(false);

      // Reset form
      setAddBalanceForm({
        employee_id: 0,
        leave_type_id: 0,
        year: new Date().getFullYear(),
        earned_days: 0,
        carried_forward: 0,
        reason: "",
      });

      // Reload balances if viewing the same employee
      if (selectedEmployee === addBalanceForm.employee_id.toString()) {
        loadBalances();
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to create leave balance"
          : "Failed to create leave balance";
      showToast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing dialog
      setAddBalanceForm({
        employee_id: 0,
        leave_type_id: 0,
        year: new Date().getFullYear(),
        earned_days: 0,
        carried_forward: 0,
        reason: "",
      });
      setEmployeeComboboxOpen(false);
      setEmployeeSearchValue("");
    }
    setShowAddDialog(open);
  };

  if (isLoading && balances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading balances...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Employee Leave Balances</span>
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Balance</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Leave Balance</DialogTitle>
                  <DialogDescription>
                    Create a new leave balance entry for an employee
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-4">
                  {/* Employee Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Employee *</Label>
                      <Popover
                        open={employeeComboboxOpen}
                        onOpenChange={setEmployeeComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeComboboxOpen}
                            className="w-full justify-between"
                          >
                            {addBalanceForm.employee_id > 0
                              ? (() => {
                                  const selectedEmployee = employees.find(
                                    (employee) =>
                                      employee.id === addBalanceForm.employee_id
                                  );
                                  return selectedEmployee
                                    ? `${getEmployeeFullName(
                                        selectedEmployee
                                      )} (${selectedEmployee.employee_number})`
                                    : "Select employee...";
                                })()
                              : "Select employee..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="flex flex-col">
                            <div className="p-2">
                              <Input
                                placeholder="Search employees..."
                                value={employeeSearchValue}
                                onChange={(e) =>
                                  setEmployeeSearchValue(e.target.value)
                                }
                                className="h-9"
                              />
                            </div>
                            <div className="max-h-[200px] overflow-auto">
                              {filteredEmployees.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  No employee found.
                                </div>
                              ) : (
                                filteredEmployees.map((employee) => (
                                  <div
                                    key={employee.id}
                                    className={cn(
                                      "flex cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                                      addBalanceForm.employee_id ===
                                        employee.id && "bg-accent"
                                    )}
                                    onClick={() => {
                                      setAddBalanceForm((prev) => ({
                                        ...prev,
                                        employee_id: employee.id,
                                      }));
                                      setEmployeeComboboxOpen(false);
                                      setEmployeeSearchValue("");
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {getEmployeeFullName(employee)}
                                      </span>
                                      <span className="text-muted-foreground text-xs">
                                        ({employee.employee_number})
                                      </span>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4",
                                        addBalanceForm.employee_id ===
                                          employee.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Leave Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="leaveType">Leave Type *</Label>
                      <Select
                        value={addBalanceForm.leave_type_id.toString()}
                        onValueChange={(value) =>
                          setAddBalanceForm((prev) => ({
                            ...prev,
                            leave_type_id: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={type.id.toString()}
                            >
                              <span className="truncate">
                                {type.name} ({type.code})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Year Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Select
                        value={addBalanceForm.year.toString()}
                        onValueChange={(value) =>
                          setAddBalanceForm((prev) => ({
                            ...prev,
                            year: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2023, 2024, 2025, 2026].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Earned Days */}
                    <div className="space-y-2">
                      <Label htmlFor="earnedDays">Earned Days *</Label>
                      <Input
                        id="earnedDays"
                        type="number"
                        step="0.5"
                        min="0"
                        value={addBalanceForm.earned_days}
                        onChange={(e) =>
                          setAddBalanceForm((prev) => ({
                            ...prev,
                            earned_days: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>

                    {/* Carried Forward */}
                    <div className="space-y-2">
                      <Label htmlFor="carriedForward">Carried Forward</Label>
                      <Input
                        id="carriedForward"
                        type="number"
                        step="0.5"
                        min="0"
                        value={addBalanceForm.carried_forward}
                        onChange={(e) =>
                          setAddBalanceForm((prev) => ({
                            ...prev,
                            carried_forward: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <textarea
                      id="reason"
                      value={addBalanceForm.reason}
                      onChange={(e) =>
                        setAddBalanceForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="Reason for creating this balance..."
                      className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      disabled={isCreating}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBalance}
                      disabled={isCreating}
                      className="w-full sm:w-auto"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Balance"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Popover
                open={mainEmployeeComboboxOpen}
                onOpenChange={setMainEmployeeComboboxOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={mainEmployeeComboboxOpen}
                    className="w-full justify-between mt-1 h-10"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Search className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {selectedEmployee && selectedEmployee !== "all"
                          ? (() => {
                              const emp = employees.find(
                                (e) => e.id.toString() === selectedEmployee
                              );
                              return emp
                                ? `${getEmployeeFullName(emp)} (${
                                    emp.employee_number
                                  })`
                                : "Select employee...";
                            })()
                          : "Select employee to view balances..."}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="p-3 border-b">
                      <Input
                        placeholder="Search by name or employee ID..."
                        value={mainEmployeeSearchValue}
                        onChange={(e) =>
                          setMainEmployeeSearchValue(e.target.value)
                        }
                        className="h-9"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[400px] overflow-auto">
                      {filteredMainEmployees.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          {mainEmployeeSearchValue
                            ? "No employees found."
                            : "Start typing to search for employees..."}
                        </div>
                      ) : (
                        filteredMainEmployees.slice(0, 15).map((employee) => (
                          <div
                            key={employee.id}
                            className={cn(
                              "flex cursor-pointer items-center space-x-3 p-3 hover:bg-muted transition-colors border-b border-border/50 last:border-b-0",
                              selectedEmployee === employee.id.toString() &&
                                "bg-accent"
                            )}
                            onClick={() => {
                              setSelectedEmployee(employee.id.toString());
                              setMainEmployeeComboboxOpen(false);
                              setMainEmployeeSearchValue("");
                            }}
                          >
                            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {getEmployeeFullName(employee)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee.employee_number}
                              </div>
                              {employee.plantilla_position && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {employee.plantilla_position}
                                </div>
                              )}
                            </div>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4 text-green-600",
                                selectedEmployee === employee.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-full mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Employee Info */}
      {selectedEmployeeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>
                {selectedEmployeeData.first_name}{" "}
                {selectedEmployeeData.last_name}
              </span>
              <span className="text-muted-foreground">
                ({selectedEmployeeData.employee_number})
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Balance Cards */}
      {selectedEmployee === "all" ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an Employee</h3>
              <p>
                Choose an employee from the dropdown to view their leave
                balances.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : balances.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No leave balances found for the selected employee and year.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {balances.map((balance) => (
            <LeaveBalanceCard key={balance.id} balance={balance} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeaveBalances;
