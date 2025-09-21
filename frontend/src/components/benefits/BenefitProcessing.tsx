import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Calculator, Eye } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle } from '@/types/benefits';
import BenefitCalculation from './BenefitCalculation';
import BenefitItemsReview from './BenefitItemsReview';

const BenefitProcessing: React.FC = () => {
  const [benefitCycles, setBenefitCycles] = useState<BenefitCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<BenefitCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<'selection' | 'calculation' | 'review'>('selection');

  useEffect(() => {
    loadBenefitCycles();
  }, []);

  const loadBenefitCycles = async () => {
    try {
      const response = await benefitsService.getBenefitCycles();
      if (response.success) {
        const data = response.data;
        const cyclesData = Array.isArray(data) ? data : (data as { benefit_cycles?: BenefitCycle[] })?.benefit_cycles || [];
        // Filter to show only draft and processing cycles
        const availableCycles = cyclesData.filter(cycle =>
          ['Draft', 'Processing'].includes(cycle.status)
        );
        setBenefitCycles(availableCycles);
      } else {
        toast.error('Failed to load benefit cycles');
      }
    } catch (error) {
      console.error('Failed to load benefit cycles:', error);
      toast.error('Failed to load benefit cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleSelect = (cycle: BenefitCycle) => {
    setSelectedCycle(cycle);
    setActiveStep('selection');
  };

  const handleProceedToCalculation = () => {
    if (!selectedCycle) return;
    setActiveStep('calculation');
  };

  const handleProceedToReview = () => {
    setActiveStep('review');
  };

  const handleBackToSelection = () => {
    setActiveStep('selection');
  };

  const handleBackToCalculation = () => {
    setActiveStep('calculation');
  };

  const getStepStatus = (step: 'selection' | 'calculation' | 'review') => {
    if (step === activeStep) return 'active';
    if (step === 'selection' && ['calculation', 'review'].includes(activeStep)) return 'completed';
    if (step === 'calculation' && activeStep === 'review') return 'completed';
    return 'pending';
  };

  const getStepIcon = (step: 'selection' | 'calculation' | 'review') => {
    switch (step) {
      case 'selection':
        return <Users className="h-5 w-5" />;
      case 'calculation':
        return <Calculator className="h-5 w-5" />;
      case 'review':
        return <Eye className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStepBadge = (step: 'selection' | 'calculation' | 'review') => {
    const status = getStepStatus(step);
    const variants: { [key: string]: 'default' | 'secondary' | 'outline' } = {
      'active': 'default',
      'completed': 'outline',
      'pending': 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading benefit processing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Benefit Processing</h2>
          <p className="text-sm text-muted-foreground">
            Select employees, calculate benefits, and review results
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {(['selection', 'calculation', 'review'] as const).map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center space-y-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                getStepStatus(step) === 'active' ? 'border-primary bg-primary text-primary-foreground' :
                getStepStatus(step) === 'completed' ? 'border-green-500 bg-green-500 text-white' :
                'border-muted bg-background text-muted-foreground'
              }`}>
                {getStepIcon(step)}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium capitalize">{step}</div>
                {getStepBadge(step)}
              </div>
            </div>
            {index < 2 && (
              <div className={`w-12 h-0.5 ${
                getStepStatus(['selection', 'calculation', 'review'][index + 1] as 'selection' | 'calculation' | 'review') === 'completed'
                  ? 'bg-green-500'
                  : 'bg-muted'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {activeStep === 'selection' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Benefit Cycle</CardTitle>
                <CardDescription>
                  Choose a benefit cycle to process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {benefitCycles.map((cycle) => (
                    <Card
                      key={cycle.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCycle?.id === cycle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleCycleSelect(cycle)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{cycle.cycle_name}</CardTitle>
                          <Badge variant="outline">{cycle.status}</Badge>
                        </div>
                        <CardDescription>
                          {cycle.benefit_type_name} - {cycle.cycle_year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground">
                          <div>Applicable: {new Date(cycle.applicable_date).toLocaleDateString()}</div>
                          {cycle.payment_date && (
                            <div>Payment: {new Date(cycle.payment_date).toLocaleDateString()}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {benefitCycles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No benefit cycles available for processing. Please create a benefit cycle first.
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedCycle && (
              <div className="flex justify-end">
                <Button onClick={handleProceedToCalculation}>
                  Proceed to Employee Selection
                </Button>
              </div>
            )}
          </div>
        )}

        {activeStep === 'calculation' && selectedCycle && (
          <BenefitCalculation
            cycle={selectedCycle}
            selectedEmployees={[]}
            onProceed={handleProceedToReview}
            onBack={handleBackToSelection}
          />
        )}

        {activeStep === 'review' && selectedCycle && (
          <BenefitItemsReview
            cycle={selectedCycle}
            onBack={handleBackToCalculation}
            onComplete={loadBenefitCycles}
          />
        )}
      </div>
    </div>
  );
};

export default BenefitProcessing;