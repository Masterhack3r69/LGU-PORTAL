import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Calculator, 
  CheckCircle, 
  Loader2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import type { 
  BenefitType, 
  BenefitCalculation
} from '@/types/compensation';
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_DESCRIPTIONS
} from '@/types/compensation';
import type { Employee } from '@/types/employee';
import { compensationService } from '@/services/compensationService';
import { employeeService } from '@/services/employeeService';
import { showToast} from "@/lib/toast"

interface SingleProcessingPanelProps {
  onSuccess: () => void;
}

export function SingleProcessingPanel({ onSuccess }: SingleProcessingPanelProps) {
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | ''>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calculation, setCalculation] = useState<BenefitCalculation | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Single processing benefit types
  const singleBenefitTypes: BenefitType[] = [
    'TERMINAL_LEAVE',
    'EC' // Employee Compensation - manual input
  ];

  useEffect(() => {
    loadEmployees();
  }, [selectedBenefitType]);

  useEffect(() => {
    if (selectedBenefitType && selectedEmployeeId) {
      if (selectedBenefitType === 'EC') {
        // For Employee Compensation, don't auto-calculate
        setCalculation(null);
      } else {
        calculateBenefit();
      }
    } else {
      setCalculation(null);
    }
  }, [selectedBenefitType, selectedEmployeeId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // For Terminal Leave Benefit, load employees with resigned/terminated/retired status
      // For other benefits, load active employees
      const statusFilter = selectedBenefitType === 'TERMINAL_LEAVE' 
        ? undefined // Load all employees, will filter by status in the response
        : 'active';
        
      const response = await employeeService.getEmployees({ 
        limit: 1000, // Get all employees
        status: statusFilter
      });
      
      // Filter employees based on benefit type
      let filteredEmployees = response.employees;
      if (selectedBenefitType === 'TERMINAL_LEAVE') {
        filteredEmployees = response.employees.filter(emp => 
          ['Resigned', 'Terminated', 'Retired'].includes(emp.employment_status)
        );
      }
      
      setEmployees(filteredEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showToast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const calculateBenefit = async () => {
    if (!selectedBenefitType || !selectedEmployeeId) return;

    try {
      setCalculating(true);
      const result = await compensationService.calculateBenefit(
        selectedBenefitType, 
        selectedEmployeeId as number
      );
      setCalculation(result);
    } catch (error) {
      console.error('Failed to calculate benefit:', error);
      showToast.error('Failed to calculate benefit');
    } finally {
      setCalculating(false);
    }
  };

  const processBenefit = async () => {
    if (!selectedBenefitType || !selectedEmployeeId) {
      showToast.error('Please select benefit type and employee');
      return;
    }

    const amount = selectedBenefitType === 'EC' 
      ? parseFloat(manualAmount)
      : calculation?.amount;

    // For EC (Employee Compensation), require manual amount > 0
    // For other benefits (like TERMINAL_LEAVE), allow 0 amounts as they are valid calculations
    if (selectedBenefitType === 'EC') {
      if (!amount || amount <= 0) {
        showToast.error('Please provide a valid amount');
        return;
      }
    } else {
      // For calculated benefits, ensure we have a calculation result (amount can be 0)
      if (amount === undefined || amount === null) {
        showToast.error('Please calculate the benefit first');
        return;
      }
    }

    try {
      setProcessing(true);
      await compensationService.createRecord({
        employee_id: selectedEmployeeId as number,
        benefit_type: selectedBenefitType,
        days_used: calculation?.days_used,
        amount,
        notes
      });
      
      showToast.success('Benefit processed successfully');
      onSuccess();
      
      // Reset form
      setSelectedBenefitType('');
      setSelectedEmployeeId('');
      setManualAmount('');
      setNotes('');
      setCalculation(null);
    } catch (error) {
      console.error('Failed to process benefit:', error);
      showToast.error('Failed to process benefit');
    } finally {
      setProcessing(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Single Employee Processing
          </CardTitle>
          <CardDescription>
            Process benefits for individual employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Benefit Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Benefit Type</label>
              <Select
                value={selectedBenefitType}
                onValueChange={(value) => setSelectedBenefitType(value as BenefitType)}
              >
                <SelectTrigger className="md:w-[200px] w-[125px]" >
                  <SelectValue placeholder="Select benefit type" />
                </SelectTrigger>
                <SelectContent>
                  {singleBenefitTypes.map((type) => (
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

            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={selectedEmployeeId.toString()}
                onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger className="md:w-[300px] w-[250px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name} ({employee.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manual Amount for EC */}
          {selectedBenefitType === 'EC' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="Enter compensation amount"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add processing notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
                <p className="font-medium">{selectedEmployee.employee_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Monthly Salary</label>
                <p className="font-medium">
                  {compensationService.formatCurrency(selectedEmployee.current_monthly_salary || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <p className="font-medium">{selectedEmployee.plantilla_position || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Appointment Date</label>
                <p className="font-medium">
                  {selectedEmployee.appointment_date 
                    ? compensationService.formatDate(selectedEmployee.appointment_date)
                    : '-'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={selectedEmployee.employment_status === 'Active' ? 'default' : 'secondary'}>
                  {selectedEmployee.employment_status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Results */}
      {selectedBenefitType && selectedEmployeeId && selectedBenefitType !== 'EC' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Benefit Calculation</CardTitle>
                <CardDescription>
                  Calculated amount for {BENEFIT_TYPE_LABELS[selectedBenefitType]}
                </CardDescription>
              </div>
              <Button
                onClick={calculateBenefit}
                disabled={calculating}
                variant="outline"
              >
                {calculating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Recalculate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {calculating ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-muted-foreground">Calculating benefit...</p>
              </div>
            ) : calculation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Calculated Amount</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {compensationService.formatCurrency(calculation.amount)}
                  </span>
                </div>

                {calculation.calculation_details && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(calculation.calculation_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium">
                          {typeof value === 'number' 
                            ? (key.includes('salary') || key.includes('rate') 
                                ? compensationService.formatCurrency(value)
                                : value.toLocaleString()
                              )
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No calculation available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Process Button */}
      <div className="flex justify-end">
        <Button
          onClick={processBenefit}
          disabled={
            processing || 
            !selectedBenefitType || 
            !selectedEmployeeId ||
            (selectedBenefitType === 'EC' && (!manualAmount || parseFloat(manualAmount) <= 0)) ||
            (selectedBenefitType !== 'EC' && !calculation)
          }
          size="lg"
        >
          {processing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Process Benefit
        </Button>
      </div>
    </div>
  );
}