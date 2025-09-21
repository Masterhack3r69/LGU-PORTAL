import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import trainingService from '@/services/trainingService';
import type { TrainingTypeStatistic, TrainingTrendStatistic, EmployeeTrainingStatistic } from '@/types/training';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}> = ({ title, value, icon: Icon, trend, className = '' }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

const TrainingStatistics: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Fetch training statistics
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['training-statistics', currentYear],
    queryFn: () => trainingService.getTrainingStatistics({ year: currentYear }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load training statistics</p>
            <button onClick={() => refetch()} className="mt-2 text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading training statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Trainings"
              value={stats.summary?.total_trainings || 0}
              icon={Calendar}
            />
            <StatCard
              title="Total Hours"
              value={`${stats.summary?.total_hours || '0.00'}h`}
              icon={Clock}
            />
            <StatCard
              title="Certificates Issued"
              value={stats.summary?.certificates_issued || 0}
              icon={Award}
            />
            <StatCard
              title="Average Hours"
              value={`${stats.summary?.avg_duration || '0.00'}h`}
              icon={BarChart3}
            />
          </div>

          {/* Training by Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Employees Trained"
              value={stats.summary?.employees_trained || 0}
              icon={Users}
              className="border-green-200"
            />
            <StatCard
              title="Training Types"
              value={stats.by_type?.length || 0}
              icon={BarChart3}
              className="border-blue-200"
            />
            <StatCard
              title="Monthly Records"
              value={stats.trends?.length || 0}
              icon={Calendar}
              className="border-yellow-200"
            />
          </div>

          {/* Training Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Training by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.by_type && stats.by_type.length > 0 ? (
                  stats.by_type.map((type: TrainingTypeStatistic) => (
                    <div key={type.training_type} className="text-center p-4 border rounded-lg">
                      <Badge variant="outline" className="mb-2">
                        {type.training_type}
                      </Badge>
                      <div className="space-y-1 text-sm">
                        <div>{type.count} trainings</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground">
                    No training type data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Training Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.trends && stats.trends.length > 0 ? (
                  stats.trends.map((month: TrainingTrendStatistic) => (
                    <div key={month.month} className="flex items-center justify-between p-3 border rounded">
                      <div className="font-medium">{month.month}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{month.count} trainings</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No monthly trend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Training Summary */}
          {stats.by_employee && stats.by_employee.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.by_employee?.slice(0, 10).map((employee: EmployeeTrainingStatistic) => (
                    <div key={employee.employee_id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{employee.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.count} trainings • {employee.hours} hours
                        </div>
                      </div>
                      {employee.certificates > 0 && (
                        <Badge variant="secondary">
                          <Award className="h-3 w-3 mr-1" />
                          {employee.certificates}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data State */}
      {!stats || (stats.summary && stats.summary.total_trainings === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No training data available</h3>
            <p className="text-muted-foreground">
              Training analytics will appear here once training records are created
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingStatistics;