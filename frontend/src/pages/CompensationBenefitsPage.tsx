import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Gift, User, RefreshCw, CheckCircle, AlertCircle, 
  CheckSquare, DollarSign, Calendar, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';
import type { Employee } from '@/types/employee';

// Simple Benefit Types
interface BenefitType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'BONUS' | 'ALLOWANCE' | 'AWARD' | 'MONETIZATION';
  estimated_amount: number;
  is_active: boolean;
  can_select?: boolean;
  ineligibility_reason?: string;
}

interface BenefitSelection {
  id: number;
  employee_id: number;
  benefit_type_id: number;
  year: number;
  is_selected: boolean;
  calculated_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  selection_date: string;
  benefit_name: string;
  benefit_code: string;
}

interface AvailableBenefitsData {
  employee: {
    id: number;
    name: string;
    employee_number: string;
    appointment_date: string;
  };
  year: number;
  benefits_by_category: Record<string, BenefitType[]>;
  current_selections: BenefitSelection[];
  summary: {
    total_available: number;
    total_selected: number;
    estimated_total_amount: number;
  };
}

export const CompensationBenefitsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableBenefits, setAvailableBenefits] = useState<AvailableBenefitsData | null>(null);
  const [selectedBenefits, setSelectedBenefits] = useState<number[]>([]);
  const [benefitSelections, setBenefitSelections] = useState<BenefitSelection[]>([]);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Utility functions
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);

  const getCategoryIcon = (category: string) => {
    const icons = {
      'BONUS': <Gift className="h-4 w-4" />,
      'ALLOWANCE': <DollarSign className="h-4 w-4" />,
      'AWARD': <CheckCircle className="h-4 w-4" />,
      'MONETIZATION': <Calendar className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'BONUS': 'bg-green-100 text-green-800',
      'ALLOWANCE': 'bg-blue-100 text-blue-800',
      'AWARD': 'bg-purple-100 text-purple-800',
      'MONETIZATION': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // API Service
  const compensationBenefitsService = {
    async getAvailableBenefits(employeeId: number, year: number): Promise<AvailableBenefitsData> {
      const response = await fetch(`/api/compensation-benefits/available/${employeeId}/${year}`);
      return response.json();
    },

    async selectBenefits(employeeId: number, selectedBenefits: number[], year: number) {
      const response = await fetch('/api/compensation-benefits/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, selected_benefits: selectedBenefits, year })
      });
      return response.json();
    },

    async getBenefitSelections(employeeId: number, year: number) {
      const response = await fetch(`/api/compensation-benefits/selections/${employeeId}/${year}`);
      return response.json();
    }
  };

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees);
      
      // Auto-select current user's employee if they're an employee
      if (isEmployee && user?.employee_id) {
        setSelectedEmployee(user.employee_id);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  }, [isEmployee, user?.employee_id]);

  // Load available benefits for selected employee and year
  const loadAvailableBenefits = useCallback(async () => {
    if (!selectedEmployee || !selectedYear) return;
    
    try {
      setActionLoading('benefits');
      const response = await compensationBenefitsService.getAvailableBenefits(selectedEmployee, selectedYear);
      setAvailableBenefits(response);
      
      // Set currently selected benefits
      const currentlySelected = response.current_selections
        .filter(s => s.is_selected)
        .map(s => s.benefit_type_id);
      setSelectedBenefits(currentlySelected);
      
    } catch (error) {
      console.error('Failed to load available benefits:', error);
      toast.error('Failed to load available benefits');
    } finally {
      setActionLoading(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, selectedYear]);

  // Load benefit selections history
  const loadBenefitSelections = useCallback(async () => {
    if (!selectedEmployee || !selectedYear) return;
    
    try {
      const response = await compensationBenefitsService.getBenefitSelections(selectedEmployee, selectedYear);
      setBenefitSelections(response.data.selections || []);
    } catch (error) {
      console.error('Failed to load benefit selections:', error);
      toast.error('Failed to load benefit selections');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, selectedYear]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (selectedEmployee && selectedYear) {
      loadAvailableBenefits();
      loadBenefitSelections();
    }
  }, [selectedEmployee, selectedYear, loadAvailableBenefits, loadBenefitSelections]);

  // Handle benefit selection
  const handleBenefitToggle = (benefitId: number, canSelect: boolean) => {
    if (!canSelect) return;
    
    setSelectedBenefits(prev => {
      if (prev.includes(benefitId)) {
        return prev.filter(id => id !== benefitId);
      } else {
        return [...prev, benefitId];
      }
    });
  };

  // Submit benefit selections
  const handleSubmitSelections = async () => {
    if (!selectedEmployee || !selectedYear) return;
    
    try {
      setActionLoading('submit');
      
      const response = await compensationBenefitsService.selectBenefits(
        selectedEmployee, 
        selectedBenefits, 
        selectedYear
      );
      
      if (response.success) {
        toast.success(
          `✅ Benefits Selected Successfully!
          ${response.data.selections_processed} benefit types processed.
          Total Estimated Amount: ${formatCurrency(response.data.total_estimated_amount)}`
        );
        
        loadAvailableBenefits();
        loadBenefitSelections();
        setSelectedBenefits([]);
      }
    } catch (error) {
      console.error('Failed to submit benefit selections:', error);
      toast.error('Failed to submit benefit selections');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gift className="mr-2 h-6 w-6" />
            Compensation & Benefits Selection
          </h1>
          <p className="text-gray-600">
            Manual selection of bonuses, allowances, awards, and other benefits
          </p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md inline-block">
            👤 This system requires manual selection and approval for compensation benefits
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">System Type</div>
          <Badge className="bg-blue-100 text-blue-800">
            <User className="mr-1 h-3 w-3" />
            Manual Selection System
          </Badge>
        </div>
      </div>

      {/* Employee and Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Employee Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdmin && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Employee</label>
                <Select
                  value={selectedEmployee?.toString() || ''}
                  onValueChange={(value) => setSelectedEmployee(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.first_name} {employee.last_name} ({employee.employee_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={loadAvailableBenefits} 
                disabled={!selectedEmployee || actionLoading === 'benefits'}
                className="w-full"
              >
                {actionLoading === 'benefits' ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="mr-2 h-4 w-4" />
                )}
                Load Benefits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Selection Interface */}
      {availableBenefits && (
        <>
          {/* Employee Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium">{availableBenefits.employee.name}</div>
                  <div className="text-sm text-gray-500">{availableBenefits.employee.employee_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Appointment Date</div>
                  <div className="font-medium">
                    {new Date(availableBenefits.employee.appointment_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Available Benefits</div>
                  <div className="font-medium text-green-600">{availableBenefits.summary.total_available}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Estimated Total</div>
                  <div className="font-medium text-blue-600">
                    {formatCurrency(availableBenefits.summary.estimated_total_amount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefit Categories */}
          <div className="space-y-4">
            {Object.entries(availableBenefits.benefits_by_category).map(([category, benefits]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getCategoryIcon(category)}
                    <span className="ml-2">{category.replace('_', ' ')} Benefits</span>
                    <Badge className={`ml-2 ${getCategoryColor(category)}`}>
                      {benefits.length} available
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {benefits.map(benefit => (
                      <div 
                        key={benefit.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          benefit.can_select ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedBenefits.includes(benefit.id)}
                            onCheckedChange={() => handleBenefitToggle(benefit.id, benefit.can_select || false)}
                            disabled={!benefit.can_select}
                          />
                          <div>
                            <div className="font-medium flex items-center">
                              {benefit.name}
                              <Badge className={`ml-2 ${getCategoryColor(benefit.category)}`}>
                                {benefit.code}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">{benefit.description}</div>
                            {!benefit.can_select && benefit.ineligibility_reason && (
                              <div className="text-sm text-red-600 mt-1">
                                ❌ {benefit.ineligibility_reason}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(benefit.estimated_amount)}
                          </div>
                          <div className="text-sm text-gray-500">{benefit.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selection Summary and Submit */}
          <Card>
            <CardHeader>
              <CardTitle>Selection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Selected Benefits</div>
                  <div className="font-semibold">{selectedBenefits.length} benefits selected</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Estimated Total Amount</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      selectedBenefits.reduce((total, benefitId) => {
                        const benefit = Object.values(availableBenefits.benefits_by_category)
                          .flat()
                          .find(b => b.id === benefitId);
                        return total + (benefit?.estimated_amount || 0);
                      }, 0)
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSubmitSelections}
                  disabled={selectedBenefits.length === 0 || actionLoading === 'submit'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading === 'submit' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Submit Selections ({selectedBenefits.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Current Benefit Selections */}
      {benefitSelections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Your Benefit Selections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {benefitSelections.map(selection => (
                <div key={selection.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{selection.benefit_name}</div>
                    <div className="text-sm text-gray-500">
                      Selected on {new Date(selection.selection_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(selection.calculated_amount)}</div>
                    <Badge className={`${selection.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                      selection.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                      selection.status === 'PAID' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-red-100 text-red-800'}`}>
                      {selection.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How Benefits Selection Works</AlertTitle>
        <AlertDescription>
          1. Select the employee and year for benefit selection
          2. Review available benefits by category
          3. Use checkboxes to select desired benefits
          4. Review estimated amounts and submit your selections
          5. Wait for administrative approval before benefits are processed
          6. Track status of your selections in the history section
        </AlertDescription>
      </Alert>
    </div>
  );
};