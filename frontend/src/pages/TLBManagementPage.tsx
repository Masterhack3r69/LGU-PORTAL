// pages/TLBManagementPage.tsx - Terminal Leave Benefits Management Page
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TLBRecordsList } from '@/components/tlb/TLBRecordsList';
import { TLBCalculator } from '@/components/tlb/TLBCalculator';
import { TLBReports } from '@/components/tlb/TLBReports';
import { Calculator, FileText, BarChart3, Users } from 'lucide-react';

export function TLBManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('records');

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access Terminal Leave Benefits management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Terminal Leave Benefits Management</h1>
          <p className="text-muted-foreground">
            Manage TLB calculations, records, and reports
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            TLB Records
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TLB Records Management</CardTitle>
              <CardDescription>
                View, create, and manage Terminal Leave Benefits records for employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TLBRecordsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TLB Calculator</CardTitle>
              <CardDescription>
                Calculate Terminal Leave Benefits for employees before creating records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TLBCalculator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TLB Reports & Statistics</CardTitle>
              <CardDescription>
                View comprehensive reports and statistics for Terminal Leave Benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TLBReports />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}