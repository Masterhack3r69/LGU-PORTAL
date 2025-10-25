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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Search,
  Plus,
  User,
  Loader2,
  Check,
  ChevronsUpDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import leaveService from "@/services/leaveService";
import employeeService from "@/services/employeeService";
import { showToast } from "@/lib/toast";
import type {
  LeaveBalance,
  LeaveType,
  CreateLeaveBalanceDTO,
  BalanceUtilization,
} from "@/types/leave";
import type { Employee } from "@/types/employee";

const AdminLeaveBalances: React.FC = () => {
  const [allBalances, setAllBalances] = useState<BalanceUtilization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Detail dialog state
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<BalanceUtilization | null>(null);

  // Combobox state
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");

  // Form state for adding new balance
  const [addBalanceForm, setAddBalanceForm] = useState<CreateLeaveBalanceDTO>({
    employee_id: 0,
    leave_type_id: 0,
    year: new Date().getFullYear(),
    earned_days: 0,
    carried_forward: 0,
    reason: "",
  });

  // Current balances for selected employee
  const [currentEmployeeBalances, setCurrentEmployeeBalances] = useState<
    LeaveBalance[]
  >([]);
  const [loadingCurrentBalances, setLoadingCurrentBalances] = useState(false);

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

  const loadAllBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await leaveService.getAllEmployeeBalances(selectedYear);

      // Check if data is already grouped or flat
      if (data.length > 0 && data[0].balances) {
        // Data is already grouped
        setAllBalances(data);
      } else {
        // Data is flat, need to group by employee
        const groupedData: { [key: string]: BalanceUtilization } = {};

        data.forEach((item: any, index: number) => {
          // Use employee_number as primary key, fallback to employee_name + index
          const empKey =
            item.employee_number || `${item.employee_name}-${index}`;

          if (!empKey || empKey === "undefined") {
            return;
          }

          if (!groupedData[empKey]) {
            groupedData[empKey] = {
              employee_id: item.employee_id || index,
              employee_name: item.employee_name,
              employee_number: item.employee_number,
              department: item.department || item.plantilla_position,
              balances: [],
            };
          }

          // Calculate utilization percentage
          const utilization =
            item.utilization_percentage ||
            (item.earned_days > 0
              ? (item.used_days / item.earned_days) * 100
              : 0);

          // Add this leave type balance to the employee's balances array
          groupedData[empKey].balances.push({
            leave_type_name: item.leave_type || item.leave_type_name,
            leave_type_code: item.leave_type_code,
            earned_days: Number(item.earned_days) || 0,
            used_days: Number(item.used_days) || 0,
            current_balance: Number(item.current_balance) || 0,
            utilization_percentage: Number(utilization) || 0,
            status:
              item.balance_status?.toLowerCase() ||
              (utilization >= 80
                ? "high"
                : utilization >= 60
                ? "medium"
                : "low"),
          });
        });

        const uniqueBalances = Object.values(groupedData).filter(
          (emp) => emp.employee_name
        );
        setAllBalances(uniqueBalances);
      }
    } catch (error) {
      showToast.error("Failed to load employee balances");
      console.error("Error loading balances:", error);
      setAllBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadEmployees();
    loadLeaveTypes();
  }, [loadEmployees, loadLeaveTypes]);

  useEffect(() => {
    loadAllBalances();
  }, [loadAllBalances]);

  // Load current balances when employee is selected
  useEffect(() => {
    const loadCurrentBalances = async () => {
      if (addBalanceForm.employee_id > 0) {
        try {
          setLoadingCurrentBalances(true);
          const balances = await leaveService.getLeaveBalances(
            addBalanceForm.employee_id,
            addBalanceForm.year
          );
          setCurrentEmployeeBalances(balances);
        } catch (error) {
          console.error("Error loading current balances:", error);
          setCurrentEmployeeBalances([]);
        } finally {
          setLoadingCurrentBalances(false);
        }
      } else {
        setCurrentEmployeeBalances([]);
      }
    };

    loadCurrentBalances();
  }, [addBalanceForm.employee_id, addBalanceForm.year]);

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

  // Filter balances based on search term
  const filteredBalances = allBalances.filter((balance) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      balance.employee_name.toLowerCase().includes(searchLower) ||
      balance.employee_number.toLowerCase().includes(searchLower) ||
      balance.department?.toLowerCase().includes(searchLower)
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
      setCurrentEmployeeBalances([]);

      // Reload balances
      loadAllBalances();
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
      setCurrentEmployeeBalances([]);
    }
    setShowAddDialog(open);
  };

  const getUtilizationBadge = (percentage: number) => {
    if (percentage >= 80) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">High</Badge>
      );
    }
    if (percentage >= 60) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          Medium
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Low
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading employee balances...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Employee Leave Balances
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View all employee leave allocations for {selectedYear}
                </p>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Balance</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] overflow-y-auto">
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

                  {/* Current Balances Display */}
                  {addBalanceForm.employee_id > 0 && (
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">
                          Current Balances for {addBalanceForm.year}
                        </h4>
                      </div>
                      {loadingCurrentBalances ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Loading balances...</span>
                        </div>
                      ) : currentEmployeeBalances.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No existing balances found for this employee.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentEmployeeBalances.map((balance) => (
                            <div
                              key={balance.id}
                              className="p-3 bg-background rounded border"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {balance.leave_type_name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {balance.leave_type_code}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">
                                    Earned:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {Number(balance.earned_days).toFixed(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Used:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {Number(balance.used_days).toFixed(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Available:
                                  </span>
                                  <span className="ml-1 font-medium text-green-600">
                                    {Number(balance.current_balance).toFixed(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Pending:
                                  </span>
                                  <span className="ml-1 font-medium text-yellow-600">
                                    {Number(balance.pending_days).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
                          {Array.from(
                            { length: 10 },
                            (_, i) => new Date().getFullYear() - 5 + i
                          ).map((year) => (
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by employee name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - 5 + i
                  ).map((year) => (
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

      {/* Balance Table */}
      <Card>
        <CardContent className="p-0">
          {filteredBalances.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {allBalances.length === 0
                ? "No employee balances found for this year."
                : "No employees match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="w-[200px]">Employee Name</TableHead>
                    <TableHead className="w-[120px]">Employee ID</TableHead>
                    <TableHead className="text-center">
                      Total Leave Types
                    </TableHead>
                    <TableHead className="text-center">
                      Total Available
                    </TableHead>
                    <TableHead className="text-center">Total Used</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((employeeBalance, index) => {
                    const totalAvailable =
                      employeeBalance.balances?.reduce(
                        (sum, b) => sum + Number(b.current_balance),
                        0
                      ) || 0;
                    const totalUsed =
                      employeeBalance.balances?.reduce(
                        (sum, b) => sum + Number(b.used_days),
                        0
                      ) || 0;
                    const totalEarned =
                      employeeBalance.balances?.reduce(
                        (sum, b) => sum + Number(b.earned_days),
                        0
                      ) || 0;
                    const avgUtilization =
                      totalEarned > 0 ? (totalUsed / totalEarned) * 100 : 0;

                    return (
                      <TableRow
                        key={`employee-${
                          employeeBalance.employee_number ||
                          employeeBalance.employee_id ||
                          index
                        }`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedEmployee(employeeBalance);
                          setShowDetailDialog(true);
                        }}
                      >
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span>{employeeBalance.employee_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {employeeBalance.employee_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {employeeBalance.balances?.length || 0} types
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-green-600">
                            {totalAvailable.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            days
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-orange-600">
                            {totalUsed.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            days
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getUtilizationBadge(avgUtilization)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">
                  {selectedEmployee?.employee_name}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Employee ID: {selectedEmployee?.employee_number}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              View detailed leave balance information for this employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-lg font-semibold">
                Leave Balance Details - {selectedYear}
              </h3>
              <Badge variant="outline" className="text-sm">
                {selectedEmployee?.balances?.length || 0} Leave Types
              </Badge>
            </div>

            {selectedEmployee?.balances &&
            selectedEmployee.balances.length > 0 ? (
              <div className="grid gap-4">
                {selectedEmployee.balances.map((balance, idx) => (
                  <Card key={idx} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {balance.leave_type_name}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {balance.leave_type_code}
                          </Badge>
                        </div>
                        {getUtilizationBadge(balance.utilization_percentage)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Earned Days
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {Number(balance.earned_days).toFixed(1)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Used Days
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {Number(balance.used_days).toFixed(1)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Available
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {Number(balance.current_balance).toFixed(1)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Utilization
                          </p>
                          <p className="text-2xl font-bold">
                            {Number(
                              balance.utilization_percentage || 0
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No leave balances found for this employee.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      {filteredBalances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBalances.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active employees with balances
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Leave Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveTypes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available leave categories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedYear}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current viewing period
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveBalances;
