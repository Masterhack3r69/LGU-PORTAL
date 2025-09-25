import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Users,
  Calendar,
  GraduationCap,
  DollarSign
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  description?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

function MetricCard({ 
  title, 
  value, 
  target, 
  unit = '', 
  trend = 'neutral', 
  trendValue, 
  description,
  icon,
  color = 'blue'
}: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-600" />,
    down: <TrendingDown className="h-3 w-3 text-red-600" />,
    neutral: <Minus className="h-3 w-3 text-gray-600" />
  };

  const progressPercentage = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">
            {value.toLocaleString()}{unit}
          </div>
          {trendValue && (
            <div className="flex items-center space-x-1">
              {trendIcons[trend]}
              <span className={`text-xs ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            </div>
          )}
        </div>
        
        {target && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Target: {target.toLocaleString()}{unit}</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsOverviewProps {
  type: 'admin' | 'employee';
  data: {
    totalEmployees?: number;
    activeEmployees?: number;
    pendingLeaveApplications?: number;
    completedTrainings?: number;
    totalTrainings?: number;
    leaveBalance?: number;
    profileCompletion?: number;
    monthlyStats?: {
      newEmployees: number;
      leaveApplications: number;
      completedTrainings: number;
    };
  };
}

export function MetricsOverview({ type, data }: MetricsOverviewProps) {
  if (type === 'admin') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Employee Growth"
          value={data.monthlyStats?.newEmployees || 0}
          unit=" new"
          trend="up"
          trendValue={12}
          description="New employees this month"
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        
        <MetricCard
          title="Leave Requests"
          value={data.monthlyStats?.leaveApplications || 0}
          target={50}
          unit=" apps"
          trend="neutral"
          description="Applications this month"
          icon={<Calendar className="h-4 w-4" />}
          color="green"
        />
        
        <MetricCard
          title="Training Sessions"
          value={data.monthlyStats?.completedTrainings || 0}
          target={30}
          unit=" completed"
          trend="up"
          trendValue={8}
          description="Training sessions completed"
          icon={<GraduationCap className="h-4 w-4" />}
          color="purple"
        />
        
        <MetricCard
          title="System Efficiency"
          value={96}
          target={95}
          unit="%"
          trend="up"
          trendValue={2}
          description="Overall system performance"
          icon={<Target className="h-4 w-4" />}
          color="orange"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Leave Balance"
        value={data.leaveBalance || 0}
        target={30}
        unit=" days"
        trend="neutral"
        description="Available leave days"
        icon={<Calendar className="h-4 w-4" />}
        color="blue"
      />
      
      <MetricCard
        title="Training Progress"
        value={data.completedTrainings || 0}
        target={data.totalTrainings || 1}
        unit=" completed"
        trend="up"
        trendValue={15}
        description="Training courses completed"
        icon={<GraduationCap className="h-4 w-4" />}
        color="purple"
      />
      
      <MetricCard
        title="Profile Status"
        value={data.profileCompletion || 0}
        target={100}
        unit="%"
        trend="up"
        trendValue={5}
        description="Profile completion rate"
        icon={<Users className="h-4 w-4" />}
        color="green"
      />
      
      <MetricCard
        title="Monthly Goal"
        value={85}
        target={100}
        unit="%"
        trend="up"
        trendValue={10}
        description="Personal development goal"
        icon={<Target className="h-4 w-4" />}
        color="orange"
      />
    </div>
  );
}