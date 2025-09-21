import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import BenefitTypesManagement from './BenefitTypesManagement';
import BenefitCyclesManagement from './BenefitCyclesManagement';

import SimplifiedBenefitProcessing from './SimplifiedBenefitProcessing';
import BenefitsReports from './BenefitsReports';
import benefitsService from '@/services/benefitsService';
import type { BenefitType, BenefitCycle, BenefitStatistics } from '@/types/benefits';
import {
  Settings,
  Calendar,
  Zap,
  BarChart3,
  FileText,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react';

const AdminBenefitsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('simplified');
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [benefitCycles, setBenefitCycles] = useState<BenefitCycle[]>([]);
  const [statistics, setStatistics] = useState<BenefitStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        setLoading(true);
        const [typesResponse, cyclesResponse, statsResponse] = await Promise.all([
          benefitsService.getBenefitTypes(),
          benefitsService.getBenefitCycles(),
          benefitsService.getBenefitStatistics()
        ]);

        if (typesResponse.success) {
          const data = typesResponse.data;
          const typesData = Array.isArray(data) ? data : (data as { benefit_types?: BenefitType[] })?.benefit_types || [];
          setBenefitTypes(typesData.filter(type => type.is_active));
        }

        if (cyclesResponse.success) {
          const data = cyclesResponse.data;
          const cyclesData = Array.isArray(data) ? data : (data as { benefit_cycles?: BenefitCycle[] })?.benefit_cycles || [];
          setBenefitCycles(cyclesData);
        }

        if (statsResponse.success) {
          setStatistics(statsResponse.data);
        }
      } catch (error) {
        console.error('Failed to load overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  const getOverviewStats = () => {
    const activeCycles = benefitCycles.filter(cycle =>
      ['Processing', 'Completed', 'Released'].includes(cycle.status)
    ).length;

    const pendingProcessing = (statistics?.calculated_count || 0) + (statistics?.approved_count || 0);

    return {
      totalTypes: benefitTypes.length,
      activeCycles,
      pendingProcessing,
      totalDisbursed: statistics?.total_amount || 0
    };
  };

  const stats = getOverviewStats();

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight">Compensation & Benefits Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage benefit types, cycles, processing, and reporting
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Benefit Types</CardTitle>
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-700">{stats.totalTypes}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Active Cycles</CardTitle>
              <Activity className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600">{stats.activeCycles}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Processing</CardTitle>
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-amber-600">{stats.pendingProcessing}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Disbursed Amount</CardTitle>
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-purple-600">
              ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.totalDisbursed)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="types" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Types</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage Benefit Types</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="cycles" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Calendar className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Cycles</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage Benefit Cycles</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="simplified" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Zap className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Processing</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Benefit Processing</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="reports" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <BarChart3 className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Benefits Reports</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

        <TabsContent value="types" className="space-y-4">
          <BenefitTypesManagement />
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <BenefitCyclesManagement />
        </TabsContent>

        <TabsContent value="simplified" className="space-y-4">
          <SimplifiedBenefitProcessing />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <BenefitsReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBenefitsManagement;