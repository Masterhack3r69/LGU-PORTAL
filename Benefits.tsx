import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Gift, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import benefitsService from '../services/benefitsService';
import employeeService from '../services/employeeService';
import type { 
  EmployeeBenefitsResponse,
  BenefitCalculationResponse,
  BenefitsSummaryResponse
} from '../types/payroll';
import type { Employee } from '../types';

const Benefits: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [benefits, setBenefits] = useState<EmployeeBenefitsResponse | null>(null);
  const [benefitsSummary, setBenefitsSummary] = useState<BenefitsSummaryResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<BenefitCalculationResponse | null>(null);
  const [showCalculatorDialog, setShowCalculatorDialog] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [employeesData, summaryData] = await Promise.all([
          employeeService.getEmployees({ limit: 100 }),
          benefitsService.getBenefitsSummary(selectedYear)
        ]);
        
        setEmployees(employeesData.employees);
        setBenefitsSummary(summaryData);
      } catch (err) {
        setError('Failed to load benefits data');
        console.error('Error loading benefits data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedYear]);

  // Load employee benefits when employee is selected
  useEffect(() => {
    const loadEmployeeBenefits = async () => {
      if (!selectedEmployeeId) {
        setBenefits(null);
        setSelectedEmployee(null);
        return;
      }

      try {
        setLoading(true);
        const [benefitsData, employeeData] = await Promise.all([
          benefitsService.getEmployeeBenefits(selectedEmployeeId, selectedYear),
          employeeService.getEmployee(selectedEmployeeId)
        ]);
        
        setBenefits(benefitsData);
        setSelectedEmployee(employeeData);
      } catch (err) {
        setError('Failed to load employee benefits');
        console.error('Error loading employee benefits:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeBenefits();
  }, [selectedEmployeeId, selectedYear]);

  // Handle benefit calculation
  const handleCalculateBenefit = async (benefitType: 'thirteenth_month' | 'pbb' | 'loyalty_award') => {
    if (!selectedEmployeeId) {
      setError('Please select an employee first');
      return;
    }

    try {
      setLoading(true);
      const result = await benefitsService.calculateBenefit({
        employee_id: selectedEmployeeId,
        benefit_type: benefitType,
        year: selectedYear
      });
      
      setCalculationResult(result);
      setShowCalculatorDialog(true);
    } catch (err) {
      setError(`Failed to calculate ${benefitType.replace('_', ' ')}`);
      console.error('Error calculating benefit:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Get benefit category color
  const getBenefitCategoryColor = (code: string) => {
    const category = benefitsService.getBenefitCategory(code);
    switch (category) {
      case 'bonus': return 'bg-green-100 text-green-800';
      case 'allowance': return 'bg-blue-100 text-blue-800';
      case 'award': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Benefits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benefitsService.formatCurrency(benefitsSummary?.totals.total_benefits_amount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recipients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benefitsSummary?.totals.total_recipients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Benefit Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benefitsSummary?.totals.benefit_types || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Summary by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits Summary by Type ({selectedYear})</CardTitle>
          <CardDescription>
            Overview of all benefit distributions by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {benefitsSummary?.summary.map((item) => (
              <div key={item.benefit_code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getBenefitCategoryColor(item.benefit_code)}>
                    {item.benefit_code}
                  </Badge>
                  <div>
                    <h4 className="font-medium">{item.benefit_name}</h4>
                    <p className="text-sm text-gray-500">{item.recipient_count} recipients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{benefitsService.formatCurrency(item.total_amount)}</p>
                  <p className="text-sm text-gray-500">
                    Avg: {benefitsService.formatCurrency(item.total_amount / (item.recipient_count || 1))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render employee benefits tab
  const renderEmployeeBenefits = () => (
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Benefits</CardTitle>
          <CardDescription>
            View and manage benefits for individual employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select
                value={selectedEmployeeId?.toString() || ''}
                onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
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
            
            <div>
              <Label htmlFor="year-select">Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => handleCalculateBenefit('thirteenth_month')}
                disabled={!selectedEmployeeId || loading}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Benefits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Benefits Display */}
      {benefits && selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {benefits.employee.name}</p>
                <p><strong>Employee #:</strong> {benefits.employee.employee_number}</p>
                <p><strong>Service Years:</strong> {benefits.employee.service_years}</p>
                <p><strong>Appointment Date:</strong> {new Date(benefits.employee.appointment_date).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Benefits:</strong> {benefitsService.formatCurrency(benefits.summary.total_benefits)}</p>
                <p><strong>Taxable Amount:</strong> {benefitsService.formatCurrency(benefits.summary.total_taxable)}</p>
                <p><strong>Benefit Count:</strong> {benefits.summary.benefit_count}</p>
                <p><strong>Year:</strong> {benefits.summary.year}</p>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Status */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>13th Month Pay:</span>
                  <Badge className={benefits.eligibility.thirteenth_month ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {benefits.eligibility.thirteenth_month ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>PBB:</span>
                  <Badge className={benefits.eligibility.pbb ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {benefits.eligibility.pbb ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loyalty Award:</span>
                  <Badge className={benefits.eligibility.loyalty_award ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {benefits.eligibility.loyalty_award ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                {benefits.eligibility.next_loyalty_award_years && (
                  <p className="text-sm text-gray-500">
                    Next loyalty award in {benefits.eligibility.next_loyalty_award_years} years
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benefits Categories */}
      {benefits && (
        <div className="space-y-6">
          {/* Bonuses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2 text-green-600" />
                Performance Bonuses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {benefits.benefits.bonuses.length > 0 ? (
                <div className="space-y-2">
                  {benefits.benefits.bonuses.map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{bonus.benefit_name}</span>
                        {bonus.date_paid && (
                          <p className="text-sm text-gray-500">Paid: {new Date(bonus.date_paid).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className="font-bold">{benefitsService.formatCurrency(bonus.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No performance bonuses for {selectedYear}</p>
              )}
            </CardContent>
          </Card>

          {/* Allowances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Allowances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {benefits.benefits.allowances.length > 0 ? (
                <div className="space-y-2">
                  {benefits.benefits.allowances.map((allowance) => (
                    <div key={allowance.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{allowance.benefit_name}</span>
                        {allowance.date_paid && (
                          <p className="text-sm text-gray-500">Paid: {new Date(allowance.date_paid).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className="font-bold">{benefitsService.formatCurrency(allowance.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No allowances for {selectedYear}</p>
              )}
            </CardContent>
          </Card>

          {/* Awards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {benefits.benefits.awards.length > 0 ? (
                <div className="space-y-2">
                  {benefits.benefits.awards.map((award) => (
                    <div key={award.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{award.benefit_name}</span>
                        {award.date_paid && (
                          <p className="text-sm text-gray-500">Paid: {new Date(award.date_paid).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className="font-bold">{benefitsService.formatCurrency(award.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No awards for {selectedYear}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Benefits Administration</h1>
        <p className="text-gray-600 mt-2">
          Manage employee benefits, calculate awards, and track benefit distributions
        </p>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="ml-2 text-red-700 hover:text-red-800"
            >
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">
            {success}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="ml-2 text-green-700 hover:text-green-800"
            >
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employee-benefits">Employee Benefits</TabsTrigger>
          <TabsTrigger value="calculator">Benefit Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="employee-benefits">
          {renderEmployeeBenefits()}
        </TabsContent>

        <TabsContent value="calculator">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Benefit Calculator</CardTitle>
                <CardDescription>
                  Calculate various types of benefits for employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calc-employee">Select Employee</Label>
                      <Select
                        value={selectedEmployeeId?.toString() || ''}
                        onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an employee" />
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
                    
                    <div>
                      <Label htmlFor="calc-year">Year</Label>
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleCalculateBenefit('thirteenth_month')}
                        disabled={!selectedEmployeeId || loading}
                        variant="outline"
                        className="justify-start"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate 13th Month Pay
                      </Button>
                      
                      <Button
                        onClick={() => handleCalculateBenefit('pbb')}
                        disabled={!selectedEmployeeId || loading}
                        variant="outline"
                        className="justify-start"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Calculate PBB
                      </Button>
                      
                      <Button
                        onClick={() => handleCalculateBenefit('loyalty_award')}
                        disabled={!selectedEmployeeId || loading}
                        variant="outline"
                        className="justify-start"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Calculate Loyalty Award
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Calculator Result Dialog */}
      <Dialog open={showCalculatorDialog} onOpenChange={setShowCalculatorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benefit Calculation Result</DialogTitle>
            <DialogDescription>
              Calculation for {calculationResult?.benefit_type.replace('_', ' ')}
            </DialogDescription>
          </DialogHeader>
          
          {calculationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <span className="font-medium">Calculated Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  {benefitsService.formatCurrency(calculationResult.calculated_amount)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Employee ID:</span>
                  <span>{calculationResult.employee_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Benefit Type:</span>
                  <span className="capitalize">{calculationResult.benefit_type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Year:</span>
                  <span>{calculationResult.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Eligibility:</span>
                  <Badge className={calculationResult.eligibility.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {calculationResult.eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                {calculationResult.eligibility.reason && (
                  <div className="text-sm text-gray-600">
                    <strong>Reason:</strong> {calculationResult.eligibility.reason}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalculatorDialog(false)}>
              Close
            </Button>
            {calculationResult?.eligibility.eligible && (
              <Button onClick={() => {
                // Future: Create benefit record functionality
                setShowCalculatorDialog(false);
              }}>
                Create Benefit Record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Benefits;