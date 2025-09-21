import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminTrainingRecords from './AdminTrainingRecords';
import AdminTrainingPrograms from './AdminTrainingPrograms';
import TrainingStatistics from './TrainingStatistics';
import { 
  GraduationCap, 
  BookOpen, 
  BarChart3, 
  Users
} from 'lucide-react';

const AdminTrainingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('records');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Training Records</span>
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Programs</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Employee Training</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <AdminTrainingRecords />
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <AdminTrainingPrograms />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <AdminTrainingRecords showEmployeeView={true} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <TrainingStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTrainingManagement;