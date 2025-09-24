import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  FileText, 
  Plus,
  DollarSign,
  Calendar,
  Award
} from 'lucide-react';
import type { BenefitStatistics } from '@/types/compensation';
import { compensationService } from '@/services/compensationService';
import { BenefitRecordsTable } from '@/components/benefits/BenefitRecordsTable';
import { BulkProcessingPanel } from '@/components/benefits/BulkProcessingPanel';
import { SingleProcessingPanel } from '@/components/benefits/SingleProcessingPanel';
import { BenefitStatisticsCards } from '@/components/benefits/BenefitStatisticsCards';
import { MonetizationPanel } from '@/components/benefits/MonetizationPanel';

export function CompensationBenefitsPage() {
  const [statistics, setStatistics] = useState<BenefitStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await compensationService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compensation & Benefits</h1>
          <p className="text-muted-foreground">
            Manage employee benefits, bonuses, and compensation processing
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <BenefitStatisticsCards statistics={statistics} loading={loading} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Process
          </TabsTrigger>
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Single Process
          </TabsTrigger>
          <TabsTrigger value="monetization" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monetization
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common benefit processing tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('bulk')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Process PBB for All
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('bulk')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process 13th Month
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('monetization')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Leave Monetization
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('single')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Terminal Leave Benefit
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Processing</CardTitle>
                <CardDescription>
                  Latest benefit transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.by_benefit_type?.slice(0, 4).map((item) => (
                    <div key={item.benefit_type} className="flex items-center justify-between">
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
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Records</span>
                  <Badge variant="outline">
                    {statistics?.total_records || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Amount</span>
                  <Badge variant="outline">
                    {statistics ? compensationService.formatCurrency(statistics.total_amount) : '₱0.00'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Benefit Types</span>
                  <Badge variant="outline">
                    {statistics?.by_benefit_type?.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records">
          <BenefitRecordsTable onRefresh={handleRefresh} />
        </TabsContent>

        {/* Bulk Processing Tab */}
        <TabsContent value="bulk">
          <BulkProcessingPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Single Processing Tab */}
        <TabsContent value="single">
          <SingleProcessingPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Monetization Tab */}
        <TabsContent value="monetization">
          <MonetizationPanel onSuccess={handleRefresh} />
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Benefit Calculator</CardTitle>
              <CardDescription>
                Calculate benefits for employees without processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Calculator Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive benefit calculator will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}