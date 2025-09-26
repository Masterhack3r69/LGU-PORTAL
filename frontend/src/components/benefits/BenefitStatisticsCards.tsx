import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";
import type { BenefitStatistics } from "@/types/compensation";
import { compensationService } from "@/services/compensationService";

interface BenefitStatisticsCardsProps {
  statistics: BenefitStatistics | null;
  loading: boolean;
}

export function BenefitStatisticsCards({
  statistics,
  loading,
}: BenefitStatisticsCardsProps) {
  if (loading || !statistics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalBeneficiaries = statistics?.top_employees?.length || 0;
  const totalRecords = statistics?.total_records || 0;
  const totalAmount = statistics?.total_amount || 0;
  const averageBenefit = totalRecords > 0 ? totalAmount / totalRecords : 0;

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = statistics?.monthly_summary?.find(
    (item) => item.month === currentMonth
  );

  // Calculate growth indicators
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousMonthData = statistics?.monthly_summary?.find(
    (item) => item.month === previousMonth
  );
  
  const monthlyGrowth = previousMonthData && currentMonthData 
    ? ((currentMonthData.total_amount - previousMonthData.total_amount) / previousMonthData.total_amount) * 100
    : 0;

  return (
    <>
      {/* Main Stats Cards - Dashboard Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Benefits */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Benefits</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {compensationService.formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              across all benefit types
            </p>
          </CardContent>
        </Card>

        {/* Total Records */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              benefit transactions processed
            </p>
          </CardContent>
        </Card>

        {/* Beneficiaries */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{totalBeneficiaries}</div>
            <p className="text-xs text-muted-foreground">
              unique employees with benefits
            </p>
          </CardContent>
        </Card>

        {/* Average Benefit */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Benefit</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {compensationService.formatCurrency(averageBenefit)}
            </div>
            <p className="text-xs text-muted-foreground">per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Month Activity */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {currentMonthData ? currentMonthData.count : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">records processed</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {currentMonthData
                      ? compensationService.formatCurrency(currentMonthData.total_amount)
                      : "₱0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">total amount</p>
                </div>
              </div>
              {monthlyGrowth !== 0 && (
                <div className="flex items-center text-xs">
                  <TrendingUp className={`h-3 w-3 mr-1 ${monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Benefit Types */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Benefit Types</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics?.by_benefit_type && statistics.by_benefit_type.length > 0 ? (
                statistics.by_benefit_type
                  .sort((a, b) => b.total_amount - a.total_amount)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={item.benefit_type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                        }`} />
                        <Badge variant="secondary" className="text-xs">
                          {item.benefit_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {compensationService.formatCurrency(item.total_amount)}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No benefit data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics?.monthly_summary && statistics.monthly_summary.length > 0 ? (
                statistics.monthly_summary
                  .sort((a, b) => b.month - a.month)
                  .slice(0, 3)
                  .map((item) => {
                    const monthName = new Date(2024, item.month - 1).toLocaleDateString('en-US', { month: 'short' });
                    return (
                      <div key={item.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {monthName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} records
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {compensationService.formatCurrency(item.total_amount)}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No monthly data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
