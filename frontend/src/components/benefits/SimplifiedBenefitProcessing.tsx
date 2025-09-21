import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calculator, Users, FileCheck, CheckCircle } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, BenefitType, EligibleEmployee, BenefitItem } from '@/types/benefits';

const SimplifiedBenefitProcessing: React.FC = () => {
  // State management
  const [benefitCycles, setBenefitCycles] = useState<BenefitCycle[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<BenefitCycle | null>(null);
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | null>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<EligibleEmployee[]>([]);
  const [manualAmounts, setManualAmounts] = useState<{[key: number]: string}>({});
  const [benefitItems, setBenefitItems] = useState<BenefitItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [cyclesResponse, typesResponse] = await Promise.all([
        benefitsService.getBenefitCycles(),
        benefitsService.getBenefitTypes()
      ]);

      if (cyclesResponse.success) {
        const cyclesData = Array.isArray(cyclesResponse.data) 
          ? cyclesResponse.data 
          : (cyclesResponse.data as { benefit_cycles?: BenefitCycle[] })?.benefit_cycles || [];
        setBenefitCycles(cyclesData.filter(cycle => cycle.status === 'Draft'));
      }

      if (typesResponse.success) {
        const typesData = Array.isArray(typesResponse.data) 
          ? typesResponse.data 
          : (typesResponse.data as { benefit_types?: BenefitType[] })?.benefit_types || [];
        setBenefitTypes(typesData.filter(type => type.is_active));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load benefit data');
    } finally {
      setLoading(false);
    }
  };

  // Load eligible employees when cycle is selected
  useEffect(() => {
    if (selectedCycle) {
      loadEligibleEmployees();
      loadExistingBenefitItems();
    }
  }, [selectedCycle]);

  const loadEligibleEmployees = async () => {
    if (!selectedCycle) return;

    try {
      const response = await benefitsService.getEligibleEmployees(selectedCycle.benefit_type_id);
      console.log('Eligible employees response:', response);
      
      if (response.success) {
        // Handle different response structures from the backend
        let employees: EligibleEmployee[] = [];
        
        if (Array.isArray(response.data)) {
          employees = response.data;
        } else if (response.data && 'employees' in response.data) {
          employees = (response.data as { employees: EligibleEmployee[] }).employees;
        } else if (response.data && 'data' in response.data) {
          employees = (response.data as { data: EligibleEmployee[] }).data;
        }
        
        console.log('Setting eligible employees:', employees);
        setEligibleEmployees(employees);
      } else {
        console.error('Failed to load eligible employees:', response.message);
        toast.error('Failed to load eligible employees: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to load eligible employees:', error);
      toast.error('Failed to load eligible employees');
    }
  };

  const loadExistingBenefitItems = async () => {
    if (!selectedCycle) return;

    try {
      const response = await benefitsService.getBenefitItems(selectedCycle.id);
      console.log('Benefit items response:', response);
      
      if (response.success) {
        let items: BenefitItem[] = [];
        
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && 'benefit_items' in response.data) {
          items = (response.data as { benefit_items: BenefitItem[] }).benefit_items;
        } else if (response.data && 'data' in response.data) {
          items = (response.data as { data: BenefitItem[] }).data;
        }
        
        console.log('Setting benefit items:', items);
        setBenefitItems(items);
      } else {
        console.log('No benefit items found or error:', response.message);
      }
    } catch (error) {
      console.error('Failed to load benefit items:', error);
    }
  };

  // Find benefit type for selected cycle
  useEffect(() => {
    if (selectedCycle) {
      const benefitType = benefitTypes.find(type => type.id === selectedCycle.benefit_type_id);
      setSelectedBenefitType(benefitType || null);
    }
  }, [selectedCycle, benefitTypes]);

  const handleCycleSelect = (cycleId: string) => {
    const cycle = benefitCycles.find(c => c.id.toString() === cycleId);
    setSelectedCycle(cycle || null);
    setSelectedEmployees([]);
    setManualAmounts({});
    setBenefitItems([]);
  };

  const handleEmployeeToggle = (employee: EligibleEmployee, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employee]);
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      setManualAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[employee.id];
        return newAmounts;
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleEmployeeList = eligibleEmployees.filter(emp => emp.is_eligible);
      setSelectedEmployees(eligibleEmployeeList);
    } else {
      setSelectedEmployees([]);
      setManualAmounts({});
    }
  };

  const handleManualAmountChange = (employeeId: number, amount: string) => {
    setManualAmounts(prev => ({
      ...prev,
      [employeeId]: amount
    }));
  };

  const validateAndProcessBenefits = async () => {
    if (!selectedCycle || !selectedBenefitType) {
      toast.error('Please select a benefit cycle');
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    // Validate manual amounts for manual calculation types
    if (selectedBenefitType.calculation_type === 'Manual') {
      for (const employee of selectedEmployees) {
        const amount = manualAmounts[employee.id];
        if (!amount || parseFloat(amount) <= 0) {
          toast.error(`Please enter a valid amount for ${employee.full_name}`);
          return;
        }
      }
    }

    try {
      setProcessing(true);

      const calculateData: {
        cycle_id: number;
        employee_ids: number[];
        manual_amounts?: {[key: number]: string};
      } = {
        cycle_id: selectedCycle.id,
        employee_ids: selectedEmployees.map(emp => emp.id)
      };

      if (selectedBenefitType.calculation_type === 'Manual') {
        calculateData.manual_amounts = manualAmounts;
      }

      const response = await benefitsService.calculateBenefits(calculateData);

      if (response.success) {
        toast.success(`Benefits processed successfully for ${selectedEmployees.length} employees`);
        await loadExistingBenefitItems(); // Reload to show created items
      } else {
        toast.error('Failed to process benefits: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to process benefits:', error);
      toast.error('Failed to process benefits: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getTotalAmount = () => {
    if (selectedBenefitType?.calculation_type === 'Manual') {
      return selectedEmployees.reduce((sum, employee) => {
        const amount = parseFloat(manualAmounts[employee.id]) || 0;
        return sum + amount;
      }, 0);
    }
    return benefitItems.reduce((sum, item) => sum + (item.final_amount || 0), 0);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Draft': 'secondary',
      'Calculated': 'default',
      'Approved': 'outline',
      'Paid': 'default',
      'Cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading benefit processing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Simplified Benefit Processing</h2>
          <p className="text-sm text-muted-foreground">
            Process benefits in one comprehensive interface with all details
          </p>
        </div>
      </div>

      {/* Cycle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Benefit Cycle Selection
          </CardTitle>
          <CardDescription>
            Select the benefit cycle to process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cycle">Benefit Cycle</Label>
            <Select value={selectedCycle?.id.toString() || ''} onValueChange={handleCycleSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a benefit cycle" />
              </SelectTrigger>
              <SelectContent>
                {benefitCycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.cycle_name} - {cycle.benefit_type_name || 'Unknown'} ({cycle.cycle_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCycle && selectedBenefitType && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Benefit Type</div>
                  <div className="text-muted-foreground">{selectedBenefitType.name}</div>
                </div>
                <div>
                  <div className="font-medium">Calculation Type</div>
                  <div className="text-muted-foreground">{selectedBenefitType.calculation_type}</div>
                </div>
                <div>
                  <div className="font-medium">Applicable Date</div>
                  <div className="text-muted-foreground">
                    {new Date(selectedCycle.applicable_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Selection and Calculation */}
      {selectedCycle && selectedBenefitType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Selection & Amount Entry
            </CardTitle>
            <CardDescription>
              Select employees and {selectedBenefitType.calculation_type === 'Manual' ? 'enter manual amounts' : 'view calculated amounts'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select All */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedEmployees.length === eligibleEmployees.filter(emp => emp.is_eligible).length && eligibleEmployees.filter(emp => emp.is_eligible).length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All Eligible Employees ({eligibleEmployees.filter(emp => emp.is_eligible).length})
              </Label>
            </div>

            {/* Employee List */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-medium">Eligible Employees</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {eligibleEmployees.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No eligible employees found for this benefit cycle.</p>
                    <p className="text-sm mt-2">Please check the benefit type configuration or try a different cycle.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Select</th>
                        <th className="text-left p-4 font-medium">Employee</th>
                        <th className="text-left p-4 font-medium">Department</th>
                        <th className="text-left p-4 font-medium">Service</th>
                        {selectedBenefitType?.calculation_type === 'Manual' && (
                          <th className="text-right p-4 font-medium">Amount</th>
                        )}
                        <th className="text-left p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleEmployees.map((employee) => (
                        <tr key={employee.id} className="border-b">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedEmployees.some(emp => emp.id === employee.id)}
                              onCheckedChange={(checked) => handleEmployeeToggle(employee, checked as boolean)}
                              disabled={!employee.is_eligible}
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{employee.full_name}</div>
                              <div className="text-sm text-muted-foreground">{employee.employee_id}</div>
                            </div>
                          </td>
                          <td className="p-4">{employee.department}</td>
                          <td className="p-4">
                            <div className="text-sm">
                              {employee.service_years} years, {employee.service_months} months
                            </div>
                          </td>
                          {selectedBenefitType?.calculation_type === 'Manual' && (
                            <td className="p-4 text-right">
                              {selectedEmployees.some(emp => emp.id === employee.id) ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={manualAmounts[employee.id] || ''}
                                  onChange={(e) => handleManualAmountChange(employee.id, e.target.value)}
                                  className="w-32 text-right"
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          )}
                          <td className="p-4">
                            <Badge variant={employee.is_eligible ? 'default' : 'secondary'}>
                              {employee.is_eligible ? 'Eligible' : 'Ineligible'}
                            </Badge>
                            {!employee.is_eligible && employee.eligibility_reason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {employee.eligibility_reason}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Summary */}
            {selectedEmployees.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedEmployees.length}</div>
                        <div className="text-sm text-muted-foreground">Selected</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-2xl font-bold">{formatCurrency(getTotalAmount() / selectedEmployees.length)}</div>
                        <div className="text-sm text-muted-foreground">Average</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Benefit Items */}
      {benefitItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Processed Benefit Items
            </CardTitle>
            <CardDescription>
              Review and manage processed benefit items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Employee</th>
                      <th className="text-left p-4 font-medium">Department</th>
                      <th className="text-right p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benefitItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{item.employee?.employee_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.employee?.employee_id || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{item.employee?.department || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatCurrency(item.final_amount || 0)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(item.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {selectedCycle && selectedEmployees.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={validateAndProcessBenefits} 
            disabled={processing}
            size="lg"
          >
            {processing ? 'Processing...' : `Process Benefits for ${selectedEmployees.length} Employees`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimplifiedBenefitProcessing;