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
import { toast } from "sonner";

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
      toast.error("Failed to load eligible employees");
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
      toast.success(`Calculated benefits for ${results.length} employees`);
    } catch (error) {
      console.error("Failed to calculate benefits:", error);
      toast.error("Failed to calculate benefits");
    } finally {
      setCalculating(false);
    }
  };

  const processBenefits = async () => {
    if (!selectedBenefitType || selectedEmployees.size === 0) {
      toast.error("Please select employees to process");
      return;
    }

    try {
      setProcessing(true);
      const employeeIds = Array.from(selectedEmployees);
      await compensationService.bulkProcess({
        benefitType: selectedBenefitType,
        employeeIds,
        notes,
      });

      toast.success(
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
      toast.error("Failed to process benefits");
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Benefit Type</label>
              <Select
                value={selectedBenefitType}
                onValueChange={(value) =>
                  setSelectedBenefitType(value as BenefitType)
                }
              >
                <SelectTrigger>
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
            <div className="space-y-2">
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Eligible Employees</CardTitle>
                <CardDescription>
                  {eligibleEmployees.length} employees eligible for{" "}
                  {BENEFIT_TYPE_LABELS[selectedBenefitType]}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {calculations.length > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Total Amount
                    </div>
                    <div className="text-lg font-semibold">
                      {compensationService.formatCurrency(totalAmount)}
                    </div>
                  </div>
                )}
                <Button
                  onClick={calculateBenefits}
                  disabled={calculating || selectedEmployees.size === 0}
                  variant="outline"
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
              <div className="rounded-md border">
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
                        <TableHead>Unused Leave</TableHead>
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
                              {employee.unused_leave
                                ? `${employee.unused_leave} days`
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
