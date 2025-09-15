import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw,
  Calendar,
  Clock,
  Award,
  User,
  BarChart3
} from 'lucide-react';
import trainingService from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';

const EmployeeTrainingOverviewPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch my training history and stats
  const { 
    data: trainingHistory, 
    isLoading: isLoadingHistory 
  } = useQuery({
    queryKey: ['employee-training-history', user?.employee_id],
    queryFn: () => user?.employee_id ? trainingService.getEmployeeTrainingHistory(user.employee_id) : Promise.reject('No employee ID'),
    enabled: !!user?.employee_id,
    staleTime: 10 * 60 * 1000,
  });

  const stats = trainingHistory?.statistics;

  return (
    <div className="container mx-auto space-y-6">

      {/* Content */}
      {isLoadingHistory ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading your training overview...</span>
            </div>
          </CardContent>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trainings</p>
                  <p className="text-2xl font-bold">{stats.totalTrainings}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                  <p className="text-2xl font-bold">{stats.certificatesEarned}</p>
                </div>
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingTrainings.length}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No training data available</h3>
            <p className="text-muted-foreground">
              Your training overview will appear here once you have training records
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeTrainingOverviewPage;