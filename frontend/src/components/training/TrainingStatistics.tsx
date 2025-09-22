import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, AreaChart, Area, PieChart, Pie, CartesianGrid } from 'recharts';
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

  return (
    <div className="space-y-6">
      
      {/* Statistics Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Trainings</CardTitle>
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-700">{stats.summary?.total_trainings || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Hours</CardTitle>
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-amber-600">{stats.summary?.total_hours || '0.00'}h</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">Employees Trained</CardTitle>
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-green-600">{stats.summary?.employees_trained || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">Certificates Issued</CardTitle>
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-purple-600">{stats.summary?.certificates_issued || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Employee Training Participation - Pie Chart */}
            <Card>
              <CardHeader className="items-center pb-0">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Training Participation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                {stats.summary ? (
                  <ChartContainer
                    config={{
                      participation: {
                        label: "Employees",
                      },
                      trained: {
                        label: "Trained",
                        color: "var(--chart-1)",
                      },
                      untrained: {
                        label: "Pending Training",
                        color: "var(--chart-2)",
                      },
                    }}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={[
                          {
                            category: "trained",
                            employees: stats.summary.employees_trained || 0,
                            fill: "var(--color-trained)"
                          },
                          {
                            category: "pending",
                            employees: Math.max(1, Math.floor((stats.summary.employees_trained || 0) * 0.3)), // Estimated pending employees
                            fill: "var(--color-untrained)"
                          }
                        ]}
                        dataKey="employees"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No participation data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.by_employee && stats.by_employee.length > 0 ? (
                  <ChartContainer 
                    config={{ 
                      trainings: { 
                        label: "Trainings", 
                        color: "var(--chart-3)" 
                      } 
                    }}
                    className="aspect-auto h-[300px] w-full"
                  >
                    <BarChart 
                      layout="horizontal" 
                      data={stats.by_employee.slice(0, 10).map((emp: EmployeeTrainingStatistic) => ({ 
                        name: emp.employee_name, 
                        trainings: emp.count 
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="trainings" 
                        fill="var(--color-trainings)" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No employee training data available
                  </div>
                )}
              </CardContent>
            </Card>

            
          </div>

          <div className="grid grid-cols-1 gap-6">
          {/* Monthly Training Activity - Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Training Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.trends && stats.trends.length > 0 ? (
                  <ChartContainer 
                    config={{ 
                      trainings: { 
                        label: "Trainings", 
                        color: "var(--chart-1)" 
                      } 
                    }}
                    className="aspect-auto h-[300px] w-full"
                  >
                    <AreaChart data={stats.trends.map((trend: TrainingTrendStatistic) => ({ 
                      month: trend.month, 
                      trainings: trend.count 
                    }))}>
                      <defs>
                        <linearGradient id="fillTrainings" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="var(--color-trainings)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-trainings)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                      />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                        dataKey="trainings"
                        type="natural"
                        fill="url(#fillTrainings)"
                        stroke="var(--color-trainings)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No monthly trend data available
                  </div>
                )}
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