import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Award, Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react';
import compensationService from '@/services/compensationService';
import type { CompensationBenefit, BenefitType } from '@/types/compensation';
import { BENEFIT_TYPE_LABELS } from '@/types/compensation';
import { useAuth } from '@/contexts/AuthContext';

export function EmployeeBenefitsPage() {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState<CompensationBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadEmployeeBenefits();
  }, [selectedYear]);

  const loadEmployeeBenefits = async () => {
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const response = await compensationService.getEmployeeRecords({
        start_date: startDate,
        end_date: endDate,
        limit: 100
      });

      setBenefits(response.records);
    } catch (error) {
      console.error('Failed to load benefits:', error);
      toast.error('Failed to load benefits data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBenefitIcon = (benefitType: BenefitType) => {
    switch (benefitType) {
      case 'TERMINAL_LEAVE':
      case 'MONETIZATION':
        return <Calendar className="h-4 w-4" />;
      case 'PBB':
      case 'MID_YEAR_BONUS':
      case 'YEAR_END_BONUS':
        return <TrendingUp className="h-4 w-4" />;
      case 'LOYALTY':
        return <Award className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getBenefitColor = (benefitType: BenefitType) => {
    switch (benefitType) {
      case 'TERMINAL_LEAVE':
        return 'bg-blue-100 text-blue-700';
      case 'MONETIZATION':
        return 'bg-green-100 text-green-700';
      case 'PBB':
        return 'bg-purple-100 text-purple-700';
      case 'MID_YEAR_BONUS':
        return 'bg-orange-100 text-orange-700';
      case 'YEAR_END_BONUS':
        return 'bg-red-100 text-red-700';
      case 'LOYALTY':
        return 'bg-yellow-100 text-yellow-700';
      case 'GSIS':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const groupBenefitsByType = (benefits: CompensationBenefit[]) => {
    return benefits.reduce((acc, benefit) => {
      if (!acc[benefit.benefit_type]) {
        acc[benefit.benefit_type] = [];
      }
      acc[benefit.benefit_type].push(benefit);
      return acc;
    }, {} as Record<BenefitType, CompensationBenefit[]>);
  };

  const calculateTotalByType = (benefits: CompensationBenefit[]) => {
    return benefits.reduce((total, benefit) => total + benefit.amount, 0);
  };

  const calculateYearTotal = () => {
    return benefits.reduce((total, benefit) => total + benefit.amount, 0);
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const groupedBenefits = groupBenefitsByType(benefits);
  const yearTotal = calculateYearTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Benefits & Compensation</h1>
          <p className="text-muted-foreground">
            View your compensation and benefits history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            {getAvailableYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Benefits ({selectedYear})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(yearTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {benefits.length} benefit{benefits.length !== 1 ? 's' : ''} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leave Benefits
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                calculateTotalByType([
                  ...(groupedBenefits.TERMINAL_LEAVE || []),
                  ...(groupedBenefits.MONETIZATION || [])
                ])
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Terminal leave & monetization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bonuses
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                calculateTotalByType([
                  ...(groupedBenefits.PBB || []),
                  ...(groupedBenefits.MID_YEAR_BONUS || []),
                  ...(groupedBenefits.YEAR_END_BONUS || [])
                ])
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PBB & 13th/14th month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Other Benefits
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                calculateTotalByType([
                  ...(groupedBenefits.LOYALTY || []),
                  ...(groupedBenefits.GSIS || []),
                  ...(groupedBenefits.EC || [])
                ])
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Loyalty, GSIS & others
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits by Type */}
      <div className="grid gap-6">
        {Object.entries(groupedBenefits).map(([benefitType, benefitList]) => (
          <Card key={benefitType}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getBenefitIcon(benefitType as BenefitType)}
                {BENEFIT_TYPE_LABELS[benefitType as BenefitType]}
              </CardTitle>
              <CardDescription>
                Total: {formatCurrency(calculateTotalByType(benefitList))} • {benefitList.length} record{benefitList.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {benefitList.map((benefit) => (
                  <div key={benefit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getBenefitColor(benefit.benefit_type)}`}>
                        {getBenefitIcon(benefit.benefit_type)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(benefit.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Processed on {formatDate(benefit.processed_at)}
                        </div>
                        {benefit.days_used && (
                          <div className="text-xs text-muted-foreground">
                            Days used: {benefit.days_used}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {benefit.benefit_type}
                      </Badge>
                      {benefit.notes && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                          {benefit.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Benefits Message */}
      {benefits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Benefits Found</h3>
            <p className="text-muted-foreground mb-4">
              No compensation or benefits records found for {selectedYear}.
            </p>
            <Button variant="outline" onClick={() => setSelectedYear(new Date().getFullYear() - 1)}>
              View Previous Year
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Benefits Summary */}
      {benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits Summary for {selectedYear}</CardTitle>
            <CardDescription>
              Overview of all benefits and compensation received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Benefits Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(groupedBenefits).map(([benefitType, benefitList]) => (
                    <div key={benefitType} className="flex justify-between text-sm">
                      <span>{BENEFIT_TYPE_LABELS[benefitType as BenefitType]}</span>
                      <span className="font-medium">
                        {formatCurrency(calculateTotalByType(benefitList))}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Benefits</span>
                    <span>{formatCurrency(yearTotal)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {benefits
                    .sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime())
                    .slice(0, 5)
                    .map((benefit) => (
                      <div key={benefit.id} className="text-sm">
                        <div className="flex justify-between">
                          <span>{BENEFIT_TYPE_LABELS[benefit.benefit_type]}</span>
                          <span className="font-medium">{formatCurrency(benefit.amount)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(benefit.processed_at)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}