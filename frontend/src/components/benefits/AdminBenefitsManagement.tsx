import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import BenefitTypesManagement from './BenefitTypesManagement';
import BenefitCyclesManagement from './BenefitCyclesManagement';
import BenefitProcessing from './BenefitProcessing';
import BenefitsReports from './BenefitsReports';
import {
  Settings,
  Calendar,
  Calculator,
  BarChart3
} from 'lucide-react';

const AdminBenefitsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('types');

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight">Compensation & Benefits Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage benefit types, cycles, processing, and reporting
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="types" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Benefit Types</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Manage Benefit Types</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="cycles" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Calendar className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Benefit Cycles</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Manage Benefit Cycles</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="processing" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Calculator className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Processing</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Process Benefits</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="reports" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <BarChart3 className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
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

        <TabsContent value="processing" className="space-y-4">
          <BenefitProcessing />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <BenefitsReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBenefitsManagement;