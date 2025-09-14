// components/tlb/TLBCalculator.tsx - TLB Calculator Component
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeService } from '@/services/employeeService';
import { tlbService } from '@/services/tlbService';
import { toast } from 'sonner';
import type { Employee } from '@/types/employee';
import type { TLBCalculation } from '@/types/tlb';
import { Calculator, User, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react';

export function TLBCalculator() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [separationDate, setSeparationDate] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [calculation, setCalculation] = useState<TLBCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getEmployees({ limit: 1000 });
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEmployeeId || !separationDate || !claimDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(separationDate) > new Date(claimDate)) {
      toast.error('Separation date cannot be after claim date');
      return;
    }

    try {
      setLoading(true);
      const result = await tlbService.calculateTLB({
        employeeId: selectedEmployeeId,
        separationDate,
        claimDate,
      });
      setCalculation(result);
      toast.success('TLB calculation completed successfully');
    } catch (error) {
      console.error('Error calculating TLB:', error);
      toast.error('Failed to calculate TLB');
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedEmployeeId(null);
    setSeparationDate('');
    setClaimDate('');
    setCalculation(null);
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-4">
      {/* Calculator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Terminal Leave Benefits
          </CardTitle>
          <CardDescription>
            Enter employee information and dates to calculate TLB amount
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select
                value={selectedEmployeeId?.toString() || ''}
                onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
                disabled={employeesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={employeesLoading ? "Loading..." : "Select employee"} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="separation_date">Separation Date *</Label>
              <Input
                id="separation_date"
                type="date"
                value={separationDate}
                onChange={(e) => setSeparationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim_date">Claim Date *</Label>
              <Input
                id="claim_date"
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCalculate}
              disabled={loading || !selectedEmployeeId || !separationDate || !claimDate}
              className="flex-1"
            >
              {loading ? 'Calculating...' : 'Calculate TLB'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Selected Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee #</label>
                <p className="text-sm font-mono">{selectedEmployee.employee_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <p className="text-sm">{selectedEmployee.position}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-sm">{selectedEmployee.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Results */}
      {calculation && (
        <div className="space-y-4">
          {/* Employee Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Employee Service Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Years of Service</label>
                  <p className="text-sm font-mono">{calculation.employee.years_of_service} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Appointment Date</label>
                  <p className="text-sm">{tlbService.formatDate(calculation.employee.appointment_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="text-sm">{calculation.employee.plantilla_position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee #</label>
                  <p className="text-sm font-mono">{calculation.employee.employee_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Breakdown */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Calculation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Leave Credits</div>
                  <div className="text-xl font-bold">{calculation.calculation.total_leave_credits}</div>
                  <div className="text-xs text-muted-foreground">days</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Highest Monthly Salary</div>
                  <div className="text-xl font-bold font-mono">
                    {tlbService.formatCurrency(calculation.calculation.highest_monthly_salary)}
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Constant Factor</div>
                  <div className="text-xl font-bold">{calculation.calculation.constant_factor}</div>
                </div>
              </div>

              <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <span className="text-lg font-medium">Computed TLB Amount</span>
                </div>
                <div className="text-3xl font-bold text-primary font-mono">
                  {calculation.calculation.formatted_amount}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Formula: {calculation.calculation.total_leave_credits} × {tlbService.formatCurrency(calculation.calculation.highest_monthly_salary)} × {calculation.calculation.constant_factor}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                TLB Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Separation Date</label>
                  <p className="text-sm">{tlbService.formatDate(calculation.dates.separation_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Claim Date</label>
                  <p className="text-sm">{tlbService.formatDate(calculation.dates.claim_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning for Large Amounts */}
          {calculation.calculation.computed_amount > 1000000 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">High Amount Warning</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  The computed TLB amount exceeds ₱1,000,000. Please verify the calculation and ensure all values are correct before creating a record.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}