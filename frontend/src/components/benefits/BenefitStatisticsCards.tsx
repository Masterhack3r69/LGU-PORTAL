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
          <Card key={i}>
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

  const currentMonth = new Date().getMonth() + 1; // Get current month as number (1-12)
  const currentMonthData = statistics?.monthly_summary?.find(
    (item) => item.month === currentMonth
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Benefits</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {compensationService.formatCurrency(totalAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all benefit types
          </p>
        </CardContent>
      </Card>

      {/* Total Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalRecords.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Benefit transactions processed
          </p>
        </CardContent>
      </Card>

      {/* Beneficiaries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBeneficiaries}</div>
          <p className="text-xs text-muted-foreground">
            Unique employees with benefits
          </p>
        </CardContent>
      </Card>

      {/* Average Benefit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Benefit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {compensationService.formatCurrency(averageBenefit)}
          </div>
          <p className="text-xs text-muted-foreground">Per transaction</p>
        </CardContent>
      </Card>

      {/* Current Month Activity */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {currentMonthData ? currentMonthData.count : 0}
              </div>
              <p className="text-xs text-muted-foreground">Records processed</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {currentMonthData
                  ? compensationService.formatCurrency(
                      currentMonthData.total_amount
                    )
                  : "₱0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Total amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Benefit Types */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top Benefit Types
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistics?.by_benefit_type &&
            statistics.by_benefit_type.length > 0 ? (
              statistics.by_benefit_type
                .sort((a, b) => b.total_amount - a.total_amount)
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.benefit_type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.benefit_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.count} records
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {compensationService.formatCurrency(item.total_amount)}
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No benefit data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
