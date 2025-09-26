import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  TrendingUp,
  FileText,
  Plus,
  DollarSign,
  Calendar,
  Award,
  RefreshCw,
  Activity,
} from "lucide-react";
import type { BenefitStatistics } from "@/types/compensation";
import { compensationService } from "@/services/compensationService";
import { BenefitRecordsTable } from "@/components/benefits/BenefitRecordsTable";
import { BulkProcessingPanel } from "@/components/benefits/BulkProcessingPanel";
import { SingleProcessingPanel } from "@/components/benefits/SingleProcessingPanel";
import { BenefitStatisticsCards } from "@/components/benefits/BenefitStatisticsCards";
import { MonetizationPanel } from "@/components/benefits/MonetizationPanel";

export function CompensationBenefitsPage() {
  const [statistics, setStatistics] = useState<BenefitStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await compensationService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStatistics();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Compensation & Benefits
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage employee benefits, bonuses, and compensation processing
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <BenefitStatisticsCards statistics={statistics} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="overview"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "overview"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden md:inline">Overview</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Overview</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="records"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "records"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Records</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Records</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="bulk"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "bulk"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden md:inline">Bulk Process</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Bulk Process</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="single"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "single"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Single Process</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Single Process</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="monetization"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "monetization"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden md:inline">Monetization</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Monetization</p>
              </TooltipContent>
            </Tooltip>

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="calculator"
                  className={`flex items-center gap-2 px-2 py-2 md:px-4 rounded-md transition-all ${
                    activeTab === "calculator"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  <span className="hidden md:inline">Calculator</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Calculator</p>
              </TooltipContent>
            </Tooltip> */}
          </TabsList>
        </TooltipProvider>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common benefit processing tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  variant="outline"
                  onClick={() => setActiveTab("bulk")}
                >
                  <Users className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="font-medium">Process PBB for All</span>
                </Button>
                <Button
                  className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors"
                  variant="outline"
                  onClick={() => setActiveTab("bulk")}
                >
                  <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                  <span className="font-medium">Process 13th Month</span>
                </Button>
                <Button
                  className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 transition-colors"
                  variant="outline"
                  onClick={() => setActiveTab("monetization")}
                >
                  <Calendar className="mr-2 h-4 w-4 text-purple-600" />
                  <span className="font-medium">Leave Monetization</span>
                </Button>
                <Button
                  className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors"
                  variant="outline"
                  onClick={() => setActiveTab("single")}
                >
                  <Plus className="mr-2 h-4 w-4 text-orange-600" />
                  <span className="font-medium">Terminal Leave Benefit</span>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Processing
                </CardTitle>
                <CardDescription>Latest benefit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.by_benefit_type &&
                  statistics.by_benefit_type.length > 0 ? (
                    statistics.by_benefit_type
                      .sort((a, b) => b.total_amount - a.total_amount)
                      .slice(0, 4)
                      .map((item, index) => (
                        <div
                          key={item.benefit_type}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                index === 0
                                  ? "bg-green-500"
                                  : index === 1
                                  ? "bg-blue-500"
                                  : index === 2
                                  ? "bg-purple-500"
                                  : "bg-orange-500"
                              }`}
                            />
                            <Badge variant="secondary" className="text-xs">
                              {item.benefit_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {compensationService.formatCurrency(
                              item.total_amount
                            )}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>Current system information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {statistics?.total_records || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Records
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold text-primary">
                      {statistics?.by_benefit_type?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Benefit Types
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Amount</span>
                    <Badge variant="outline" className="font-mono">
                      {statistics
                        ? compensationService.formatCurrency(
                            statistics.total_amount
                          )
                        : "₱0.00"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Status</span>
                    <Badge
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <div className="w-2 h-2 bg-white rounded-full mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Benefit Records</h2>
              <p className="text-sm text-muted-foreground">
                View and manage all compensation benefit records
              </p>
            </div>
          </div> */}
          <BenefitRecordsTable onRefresh={handleRefresh} />
        </TabsContent>

        {/* Bulk Processing Tab */}
        <TabsContent value="bulk" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Bulk Processing</h2>
              <p className="text-sm text-muted-foreground">
                Process benefits for multiple employees at once
              </p>
            </div>
          </div> */}
          <BulkProcessingPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Single Processing Tab */}
        <TabsContent value="single" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Single Processing</h2>
              <p className="text-sm text-muted-foreground">
                Process benefits for individual employees
              </p>
            </div>
          </div> */}
          <SingleProcessingPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Monetization Tab */}
        <TabsContent value="monetization" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Leave Monetization</h2>
              <p className="text-sm text-muted-foreground">
                Convert unused leave days to monetary benefits
              </p>
            </div>
          </div> */}
          <MonetizationPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Benefit Calculator</h2>
              <p className="text-sm text-muted-foreground">
                Calculate benefits for employees without processing
              </p>
            </div>
          </div> */}
          {/* <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Benefit Calculator</CardTitle>
              <CardDescription className="text-base">
                Interactive benefit calculator for precise calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 border rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">Terminal Leave</h4>
                      <p className="text-xs text-muted-foreground">
                        Calculate TLB amounts
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">Monetization</h4>
                      <p className="text-xs text-muted-foreground">
                        Leave conversion rates
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium">Bonuses</h4>
                      <p className="text-xs text-muted-foreground">
                        PBB & loyalty awards
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Badge variant="secondary" className="text-sm px-4 py-2">
                      Coming Soon in Next Update
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
