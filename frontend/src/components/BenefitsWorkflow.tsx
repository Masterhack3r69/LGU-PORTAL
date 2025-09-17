import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  RefreshCw, AlertCircle, CheckCircle, Eye, 
  Gift, User, CheckSquare, 
  Calculator, FileCheck, CreditCard, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import type { Employee } from '@/types/employee';

// Types
interface BenefitType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'BONUS' | 'ALLOWANCE' | 'AWARD' | 'MONETIZATION';
  estimated_amount: number;
  can_select: boolean;
  eligibility_details?: Record<string, unknown>;
}

interface BenefitSelection {
  id: number;
  employee_id: number;
  benefit_type_id: number;
  year: number;
  calculated_amount: number;
  actual_amount?: number;
  status: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  selection_date: string;
  benefit_name: string;
  benefit_code: string;
  notes?: string;
}

interface BenefitsWorkflowProps {
  employees: Employee[];
  isAdmin: boolean;
  user: { id: number; role: string; employee_id?: number } | null;
}

export const BenefitsWorkflow: React.FC<BenefitsWorkflowProps> = ({ 
  employees, 
  isAdmin, 
  user 
}) => {
  // State
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(
    !isAdmin && user?.employee_id ? user.employee_id : null
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableBenefits, setAvailableBenefits] = useState<BenefitType[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<number[]>([]);
  const [benefitSelections, setBenefitSelections] = useState<BenefitSelection[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'selection' | 'calculation' | 'review' | 'approval' | 'processing' | 'completed'>('selection');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [modifiedAmounts, setModifiedAmounts] = useState<Record<number, number>>({});

  // Utility functions
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);

  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CALCULATED': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PAID': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // API Functions
  const loadAvailableBenefits = useCallback(async () => {
    if (!selectedEmployee || !selectedYear) return;
    
    try {
      setActionLoading('benefits');
      const response = await apiService.get<{
        success: boolean;
        data: {
          benefits_by_category?: Record<string, BenefitType[]>;
          employee?: { id: number; name: string; };
          summary?: { total_available: number; };
        };
      }>(`/compensation-benefits/available-benefits/${selectedEmployee}?year=${selectedYear}`);
      
      // Extract benefits from categories
      const allBenefits: BenefitType[] = [];
      if (response.data?.benefits_by_category) {
        Object.values(response.data.benefits_by_category).forEach(categoryBenefits => {
          allBenefits.push(...categoryBenefits);
        });
      }
      
      setAvailableBenefits(allBenefits);
      setCurrentStep('selection');
      
      if (allBenefits.length > 0) {
        toast.success(`Found ${allBenefits.length} available benefits`);
      } else {
        toast.info('No available benefits found');
      }
    } catch (error) {
      console.error('Failed to load benefits:', error);
      toast.error('Failed to load available benefits');
    } finally {
      setActionLoading(null);
    }
  }, [selectedEmployee, selectedYear]);

  const loadBenefitSelections = useCallback(async () => {
    if (!selectedEmployee || !selectedYear) return;
    
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          benefit_history?: BenefitSelection[];
          summary?: { total_selections: number; };
        };
      }>(`/compensation-benefits/history/${selectedEmployee}?year=${selectedYear}`);
      
      setBenefitSelections(response.data?.benefit_history || []);
      const currentlySelected = response.data?.benefit_history
        ?.filter((s: BenefitSelection) => s.status !== 'CANCELLED')
        ?.map((s: BenefitSelection) => s.benefit_type_id) || [];
      setSelectedBenefits(currentlySelected);
      
      // Determine current step based on selections
      if (response.data?.benefit_history?.length) {
        const hasCalculated = response.data.benefit_history.some(s => s.status === 'CALCULATED');
        const hasApproved = response.data.benefit_history.some(s => s.status === 'APPROVED');
        const hasPaid = response.data.benefit_history.some(s => s.status === 'PAID');
        
        if (hasPaid) setCurrentStep('completed');
        else if (hasApproved) setCurrentStep('processing');
        else if (hasCalculated) setCurrentStep('review');
        else setCurrentStep('calculation');
      }
    } catch (error) {
      console.error('Failed to load benefit selections:', error);
      setBenefitSelections([]);
      setSelectedBenefits([]);
    }
  }, [selectedEmployee, selectedYear]);

  // Event Handlers
  const handleBenefitToggle = (benefitId: number) => {
    setSelectedBenefits(prev => 
      prev.includes(benefitId) 
        ? prev.filter(id => id !== benefitId)
        : [...prev, benefitId]
    );
  };

  const handleSubmitSelections = async () => {
    if (!selectedEmployee || selectedBenefits.length === 0) return;
    
    try {
      setActionLoading('submit');
      const selections = selectedBenefits.map(benefitId => {
        const benefit = availableBenefits.find(b => b.id === benefitId);
        return {
          benefit_type_id: benefitId,
          selected_amount: benefit?.estimated_amount || 0
        };
      });
      
      const response = await apiService.post<{
        success: boolean;
        message: string;
      }>('/compensation-benefits/submit-selections', {
        employee_id: selectedEmployee,
        year: selectedYear,
        selections
      });
      
      if (response.success) {
        toast.success('Benefits submitted for calculation!');
        setCurrentStep('calculation');
        loadBenefitSelections();
      }
    } catch (error) {
      console.error('Failed to submit benefits:', error);
      toast.error('Failed to submit benefit selections');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithModifications = async () => {
    if (!user || benefitSelections.length === 0) return;
    
    try {
      setActionLoading('approve');
      
      // Update selections with modified amounts
      const updatePromises = benefitSelections
        .filter(s => s.status === 'CALCULATED')
        .map(async (selection) => {
          const modifiedAmount = modifiedAmounts[selection.id];
          if (modifiedAmount && modifiedAmount !== selection.calculated_amount) {
            await apiService.put(`/compensation-benefits/selections/${selection.id}`, {
              actual_amount: modifiedAmount,
              status: 'APPROVED',
              notes: `Amount modified by admin from ${formatCurrency(selection.calculated_amount)} to ${formatCurrency(modifiedAmount)}`
            });
          } else {
            await apiService.put(`/compensation-benefits/selections/${selection.id}`, {
              actual_amount: selection.calculated_amount,
              status: 'APPROVED'
            });
          }
        });
      
      await Promise.all(updatePromises);
      
      toast.success('Benefits approved for processing!');
      setCurrentStep('approval');
      setShowReviewDialog(false);
      loadBenefitSelections();
    } catch (error) {
      console.error('Failed to approve benefits:', error);
      toast.error('Failed to approve benefits');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessPayments = async () => {
    if (!user || benefitSelections.length === 0) return;
    
    try {
      setActionLoading('process');
      const selectionIds = benefitSelections
        .filter(s => s.status === 'APPROVED')
        .map(s => s.id);
      
      if (selectionIds.length === 0) {
        toast.error('No approved benefits to process');
        return;
      }
      
      const response = await apiService.post<{
        success: boolean;
        data: {
          processed_count: number;
          processed_selections: Array<{
            selection_id: number;
            employee_name: string;
            benefit_name: string;
            amount: number;
            reference_number: string;
          }>;
        };
      }>('/compensation-benefits/process', {
        selection_ids: selectionIds,
        processed_by: user.id
      });
      
      if (response.success) {
        toast.success(`Successfully processed ${response.data.processed_count} benefit payments!`);
        setCurrentStep('completed');
        loadBenefitSelections();
      }
    } catch (error) {
      console.error('Failed to process payments:', error);
      toast.error('Failed to process benefit payments');
    } finally {
      setActionLoading(null);
    }
  };

  // Load data when employee/year changes
  React.useEffect(() => {
    if (selectedEmployee && selectedYear) {
      loadAvailableBenefits();
      loadBenefitSelections();
    }
  }, [selectedEmployee, selectedYear, loadAvailableBenefits, loadBenefitSelections]);

  // Step indicator
  const stepInfo = {
    selection: { icon: User, title: 'Employee & Benefits Selection', color: 'bg-blue-500' },
    calculation: { icon: Calculator, title: 'System Calculation', color: 'bg-yellow-500' },
    review: { icon: Eye, title: 'Admin Review', color: 'bg-orange-500' },
    approval: { icon: FileCheck, title: 'Final Approval', color: 'bg-green-500' },
    processing: { icon: CreditCard, title: 'Payment Processing', color: 'bg-purple-500' },
    completed: { icon: Trophy, title: 'Completed', color: 'bg-emerald-500' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="mr-2 h-5 w-5" />
          Benefits Selection Workflow
        </CardTitle>
        
        {/* Workflow Steps */}
        <div className="flex items-center space-x-2 mt-4">
          {Object.entries(stepInfo).map(([step, info]) => {
            const Icon = info.icon;
            const isActive = currentStep === step;
            const isCompleted = Object.keys(stepInfo).indexOf(currentStep) > Object.keys(stepInfo).indexOf(step);
            
            return (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? info.color + ' text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'font-semibold' : 'text-gray-500'}`}>
                  {info.title}
                </span>
                {step !== 'completed' && <div className="w-4 h-px bg-gray-300 mx-2" />}
              </div>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Benefits Workflow Process</AlertTitle>
          <AlertDescription>
            Follow the step-by-step process: Select employee → Choose benefits → System calculates → Admin reviews → Approve & process payments
          </AlertDescription>
        </Alert>

        {/* Employee and Year Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Benefits Selection (Step 1) */}
        {currentStep === 'selection' && availableBenefits.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Benefits</h3>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {availableBenefits.map(benefit => (
                <div 
                  key={benefit.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    benefit.can_select ? 'hover:border-blue-300' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedBenefits.includes(benefit.id)}
                      onCheckedChange={() => handleBenefitToggle(benefit.id)}
                      disabled={!benefit.can_select}
                    />
                    <div>
                      <div className="font-medium flex items-center">
                        {benefit.name}
                        <Badge className="ml-2 bg-blue-100 text-blue-800">
                          {benefit.code}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{benefit.description}</div>
                      {!benefit.can_select && (
                        <div className="text-sm text-red-600">Not eligible</div>
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

            <div className="flex justify-end">
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
          </div>
        )}

        {/* Current Selections Display */}
        {benefitSelections.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Benefit Selections</h3>
              {isAdmin && currentStep === 'calculation' && (
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review & Approve
                </Button>
              )}
              {isAdmin && currentStep === 'approval' && (
                <Button
                  onClick={handleProcessPayments}
                  disabled={actionLoading === 'process'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {actionLoading === 'process' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Process Payments
                </Button>
              )}
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benefit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefitSelections.map(selection => (
                  <TableRow key={selection.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{selection.benefit_name}</div>
                        <div className="text-sm text-gray-500">{selection.benefit_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{selection.benefit_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(selection.actual_amount || selection.calculated_amount)}
                      </div>
                      {selection.actual_amount && selection.actual_amount !== selection.calculated_amount && (
                        <div className="text-sm text-gray-500">
                          Original: {formatCurrency(selection.calculated_amount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(selection.status)}>
                        {selection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(selection.selection_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review & Approve Benefits</DialogTitle>
              <DialogDescription>
                Review calculated amounts and modify if necessary before final approval
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {benefitSelections
                .filter(s => s.status === 'CALCULATED')
                .map(selection => (
                  <div key={selection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{selection.benefit_name}</div>
                      <div className="text-sm text-gray-500">
                        Calculated: {formatCurrency(selection.calculated_amount)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Approve Amount:</label>
                      <Input
                        type="number"
                        value={modifiedAmounts[selection.id] || selection.calculated_amount}
                        onChange={(e) => setModifiedAmounts(prev => ({
                          ...prev,
                          [selection.id]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApproveWithModifications}
                  disabled={actionLoading === 'approve'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'approve' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve All Benefits
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};