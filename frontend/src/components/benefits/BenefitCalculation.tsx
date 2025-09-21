import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Calculator, Play, CheckCircle, AlertCircle } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, EligibleEmployee, BenefitPreviewResult } from '@/types/benefits';

interface BenefitCalculationProps {
  cycle: BenefitCycle;
  selectedEmployees: EligibleEmployee[];
  onProceed: () => void;
  onBack: () => void;
}

const BenefitCalculation: React.FC<BenefitCalculationProps> = ({
  cycle,
  selectedEmployees,
  onProceed,
  onBack
}) => {
  const [calculating, setCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [calculationResults, setCalculationResults] = useState<BenefitPreviewResult[]>([]);
  const [calculationComplete, setCalculationComplete] = useState(false);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setCalculationProgress(0);
      setCalculationComplete(false);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCalculationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await benefitsService.previewBenefitCalculation({
        benefit_type_id: cycle.benefit_type_id,
        employee_ids: selectedEmployees.map(emp => emp.id),
        cycle_year: cycle.cycle_year,
        applicable_date: cycle.applicable_date
      });

      clearInterval(progressInterval);
      setCalculationProgress(100);

      if (response.success) {
        const data = response.data;
        const results = Array.isArray(data) ? data : (data as { results?: BenefitPreviewResult[] })?.results || [];
        setCalculationResults(results);
        setCalculationComplete(true);

        const totalAmount = results.reduce((sum, result) => sum + result.calculated_amount, 0);
        toast.success(`Calculation completed for ${results.length} employees. Total: ₱${totalAmount.toLocaleString()}`);
      } else {
        toast.error('Failed to calculate benefits');
      }
    } catch (error) {
      console.error('Failed to calculate benefits:', error);
      toast.error('Failed to calculate benefits');
    } finally {
      setCalculating(false);
    }
  };

  const handleProceed = () => {
    if (calculationComplete) {
      onProceed();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getTotalAmount = () => {
    return calculationResults.reduce((sum, result) => sum + result.calculated_amount, 0);
  };

  const getEligibleCount = () => {
    return calculationResults.filter(result => result.is_eligible).length;
  };

  const getIneligibleCount = () => {
    return calculationResults.filter(result => !result.is_eligible).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Benefit Calculation
          </CardTitle>
          <CardDescription>
            Calculate benefits for {selectedEmployees.length} selected employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculation Progress */}
          {calculating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculating benefits...</span>
                <span className="text-sm text-muted-foreground">{calculationProgress}%</span>
              </div>
              <Progress value={calculationProgress} className="w-full" />
            </div>
          )}

          {/* Calculation Summary */}
          {calculationComplete && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{getEligibleCount()}</div>
                      <div className="text-sm text-muted-foreground">Eligible</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">{getIneligibleCount()}</div>
                      <div className="text-sm text-muted-foreground">Ineligible</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
                      <div className="text-sm text-muted-foreground">Total Amount</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calculation Results Table */}
          {calculationComplete && (
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Calculation Results</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Employee</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Calculation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResults.map((result) => (
                      <tr key={result.employee_id} className="border-b">
                        <td className="p-4">
                          <div className="font-medium">
                            {selectedEmployees.find(emp => emp.id === result.employee_id)?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {result.employee_id}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={result.is_eligible ? 'default' : 'secondary'}>
                            {result.is_eligible ? 'Eligible' : 'Ineligible'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatCurrency(result.calculated_amount)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {result.calculation_breakdown}
                          </div>
                          {!result.is_eligible && result.eligibility_notes && (
                            <div className="text-xs text-red-600 mt-1">
                              {result.eligibility_notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              {!calculationComplete && (
                <Button
                  onClick={handleCalculate}
                  disabled={calculating}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {calculating ? 'Calculating...' : 'Calculate Benefits'}
                </Button>
              )}
              {calculationComplete && (
                <Button onClick={handleProceed}>
                  Proceed to Review
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BenefitCalculation;