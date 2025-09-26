import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Clock,
  Calendar,
  RefreshCw,
  Trophy,
  Target,
  BookOpen,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import trainingService from '@/services/trainingService';
import type { TrainingTrendStatistic, EmployeeTrainingStatistic } from '@/types/training';

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

  // Prepare chart data
  const trainingTypeData = stats?.by_type?.map((type, index) => ({
    name: type.training_type,
    value: type.count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
  })) || [];

  const monthlyTrendData = stats?.trends?.map(trend => ({
    month: trend.month,
    trainings: trend.count,
    monthName: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  })) || [];

  const topPerformersData = stats?.by_employee?.slice(0, 10).map(emp => ({
    name: emp.employee_name.split(' ').slice(0, 2).join(' '), // First and last name only
    trainings: emp.count,
    hours: parseFloat(emp.hours || '0'),
    certificates: emp.certificates
  })) || [];

  return (
    <div className="space-y-6">
      
      {/* Enhanced Statistics Cards - Dashboard Style */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Trainings
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary?.total_trainings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.summary?.avg_duration || '0.00'}h average duration
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary?.total_hours || '0.00'}h</div>
                <p className="text-xs text-muted-foreground">
                  total learning time
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Employees Trained
                </CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary?.employees_trained || 0}</div>
                <p className="text-xs text-muted-foreground">
                  active participants
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Certificates Issued
                </CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary?.certificates_issued || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.summary?.total_trainings > 0 
                    ? Math.round((stats.summary?.certificates_issued / stats.summary?.total_trainings) * 100) 
                    : 0}% completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Training Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Training Types Distribution</CardTitle>
                <CardDescription>
                  Breakdown by training categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trainingTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={trainingTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {trainingTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No training type data available
                  </div>
                )}
                {trainingTypeData.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {trainingTypeData.map((entry) => (
                      <div key={entry.name} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Employees with most training completions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPerformersData.length > 0 ? (
                  <div className="space-y-3">
                    {topPerformersData.slice(0, 8).map((performer, index) => (
                      <div key={performer.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{performer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {performer.hours}h • {performer.certificates} certificates
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {performer.trainings} trainings
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No employee training data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Training Trends - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Training Activity
              </CardTitle>
              <CardDescription>
                Training completion trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendData}>
                    <defs>
                      <linearGradient id="colorTrainings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="trainings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorTrainings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No monthly trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Insights */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.summary?.avg_duration || '0.00'}h
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  per training session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Certification Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.summary?.total_trainings > 0 
                    ? Math.round((stats.summary?.certificates_issued / stats.summary?.total_trainings) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  completion with certificate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trainingTypeData.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  active program types
                </p>
              </CardContent>
            </Card>
          </div>
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