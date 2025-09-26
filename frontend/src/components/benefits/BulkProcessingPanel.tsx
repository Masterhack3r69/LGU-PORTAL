  import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calculator,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type {
  BenefitType,
  EligibleEmployee,
  BenefitCalculation,
} from "@/types/compensation";
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_DESCRIPTIONS,
} from "@/types/compensation";
import { compensationService } from "@/services/compensationService";
import { showToast} from "@/lib/toast"

interface BulkProcessingPanelProps {
  onSuccess: () => void;
}

export function BulkProcessingPanel({ onSuccess }: BulkProcessingPanelProps) {
  const [selectedBenefitType, setSelectedBenefitType] = useState<
    BenefitType | ""
  >("");
  const [eligibleEmployees, setEligibleEmployees] = useState<
    EligibleEmployee[]
  >([]);
  const [calculations, setCalculations] = useState<BenefitCalculation[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(
    new Set()
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Bulk benefit types (exclude individual ones)
  const bulkBenefitTypes: BenefitType[] = [
    "PBB",
    "MID_YEAR_BONUS",
    "YEAR_END_BONUS",
    "GSIS",
    "LOYALTY",
  ];

  useEffect(() => {
    if (selectedBenefitType) {
      loadEligibleEmployees();
    } else {
      setEligibleEmployees([]);
      setCalculations([]);
      setSelectedEmployees(new Set());
    }
  }, [selectedBenefitType]);

  const loadEligibleEmployees = async () => {
    if (!selectedBenefitType) return;

    try {
      setLoading(true);
      const employees = await compensationService.getEligibleEmployees(
        selectedBenefitType
      );
      setEligibleEmployees(employees);
      setSelectedEmployees(new Set(employees.map((emp) => emp.id)));
    } catch (error) {
      console.error("Failed to load eligible employees:", error);
      showToast.error("Failed to load eligible employees");
    } finally {
      setLoading(false);
    }
  };

  const calculateBenefits = async () => {
    if (!selectedBenefitType || selectedEmployees.size === 0) return;

    try {
      setCalculating(true);
      const employeeIds = Array.from(selectedEmployees);
      const results = await compensationService.bulkCalculate(
        selectedBenefitType,
        employeeIds
      );
      setCalculations(results);
      showToast.success(`Calculated benefits for ${results.length} employees`);
    } catch (error) {
      console.error("Failed to calculate benefits:", error);
      showToast.error("Failed to calculate benefits");
    } finally {
      setCalculating(false);
    }
  };

  const processBenefits = async () => {
    if (!selectedBenefitType || selectedEmployees.size === 0) {
      showToast.error("Please select employees to process");
      return;
    }

    try {
      setProcessing(true);
      const employeeIds = Array.from(selectedEmployees);
      
      // Use the compensation service with the updated API structure
      const response = await compensationService.bulkProcess({
        benefitType: selectedBenefitType,
        employeeIds,
        notes,
      });

      showToast.success(
        `Successfully processed ${employeeIds.length} benefit records`
      );
      onSuccess();

      // Reset form
      setSelectedBenefitType("");
      setNotes("");
      setSelectedEmployees(new Set());
      setCalculations([]);
    } catch (error) {
      console.error("Failed to process benefits:", error);
      showToast.error(error instanceof Error ? error.message : "Failed to process benefits");
    } finally {
      setProcessing(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleAll = () => {
    if (selectedEmployees.size === eligibleEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(eligibleEmployees.map((emp) => emp.id)));
    }
  };

  const getCalculationForEmployee = (employeeId: number) => {
    return calculations.find((calc) => calc.employee_id === employeeId);
  };

  const totalAmount = calculations
    .filter((calc) => selectedEmployees.has(calc.employee_id))
    .reduce((sum, calc) => sum + calc.amount, 0);

  return (
    <div className="space-y-6">
      {/* Benefit Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Benefit Processing
          </CardTitle>
          <CardDescription>
            Process benefits for multiple employees at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Benefit Type</label>
              <Select
                value={selectedBenefitType}
                onValueChange={(value) =>
                  setSelectedBenefitType(value as BenefitType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select benefit type" />
                </SelectTrigger>
                <SelectContent>
                  {bulkBenefitTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {BENEFIT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBenefitType && (
                <p className="text-sm text-muted-foreground">
                  {BENEFIT_TYPE_DESCRIPTIONS[selectedBenefitType]}
                </p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add processing notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligible Employees */}
      {selectedBenefitType && (
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Eligible Employees</CardTitle>
                <CardDescription>
                  {eligibleEmployees.length} employees eligible for{" "}
                  {BENEFIT_TYPE_LABELS[selectedBenefitType]}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {calculations.length > 0 && (
                  <div className="text-center sm:text-right">
                    <div className="text-sm text-muted-foreground">
                      Total Amount
                    </div>
                    <div className="text-lg font-semibold">
                      {compensationService.formatCurrency(totalAmount)}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={calculateBenefits}
                    disabled={calculating || selectedEmployees.size === 0}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    {calculating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="mr-2 h-4 w-4" />
                    )}
                    Calculate
                  </Button>
                  <Button
                    onClick={processBenefits}
                    disabled={
                      processing ||
                      selectedEmployees.size === 0 ||
                      calculations.length === 0
                    }
                    className="flex-1 sm:flex-none"
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Process ({selectedEmployees.size})
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-muted-foreground">
                  Loading eligible employees...
                </p>
              </div>
            ) : eligibleEmployees.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No eligible employees found
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedEmployees.size === eligibleEmployees.length
                            }
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Monthly Salary</TableHead>
                        <TableHead>Years of Service</TableHead>
                        {selectedBenefitType === "TERMINAL_LEAVE" && (
                          <TableHead>Total Leave Earned</TableHead>
                        )}
                        <TableHead className="text-right">
                          Calculated Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligibleEmployees.map((employee) => {
                        const calculation = getCalculationForEmployee(
                          employee.id
                        );
                        return (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.has(employee.id)}
                                onCheckedChange={() =>
                                  toggleEmployee(employee.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {employee.employee_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {compensationService.formatCurrency(
                                employee.current_monthly_salary
                              )}
                            </TableCell>
                            <TableCell>
                              {employee.years_of_service
                                ? `${employee.years_of_service} years`
                                : "-"}
                            </TableCell>
                            {selectedBenefitType === "TERMINAL_LEAVE" && (
                              <TableCell>
                                {employee.total_leave_earned
                                  ? `${employee.total_leave_earned} days`
                                  : "-"}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              {calculation ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-medium">
                                    {compensationService.formatCurrency(
                                      calculation.amount
                                    )}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    Calculated
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      checked={selectedEmployees.size === eligibleEmployees.length}
                      onCheckedChange={toggleAll}
                    />
                    <span className="text-sm font-medium">
                      Select All ({eligibleEmployees.length} employees)
                    </span>
                  </div>
                  
                  {eligibleEmployees.map((employee) => {
                    const calculation = getCalculationForEmployee(employee.id);
                    const isSelected = selectedEmployees.has(employee.id);
                    
                    return (
                      <Card 
                        key={employee.id} 
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                        }`}
                        onClick={() => toggleEmployee(employee.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with checkbox */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleEmployee(employee.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                  <div className="font-medium">
                                    {employee.first_name} {employee.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {employee.employee_number}
                                  </div>
                                </div>
                              </div>
                              {calculation && (
                                <Badge variant="secondary" className="text-xs">
                                  Calculated
                                </Badge>
                              )}
                            </div>

                            {/* Employee Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Monthly Salary:</span>
                                <div className="font-medium">
                                  {compensationService.formatCurrency(
                                    employee.current_monthly_salary
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Years of Service:</span>
                                <div className="font-medium">
                                  {employee.years_of_service
                                    ? `${employee.years_of_service} years`
                                    : "-"}
                                </div>
                              </div>
                            </div>

                            {/* Terminal Leave specific field */}
                            {selectedBenefitType === "TERMINAL_LEAVE" && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Total Leave Earned:</span>
                                <div className="font-medium">
                                  {employee.total_leave_earned
                                    ? `${employee.total_leave_earned} days`
                                    : "-"}
                                </div>
                              </div>
                            )}

                            {/* Calculated Amount */}
                            {calculation && (
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Calculated Amount:
                                  </span>
                                  <span className="text-lg font-semibold text-primary">
                                    {compensationService.formatCurrency(calculation.amount)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
