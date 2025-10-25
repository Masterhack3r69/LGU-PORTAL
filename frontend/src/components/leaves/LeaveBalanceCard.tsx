import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';
import type { LeaveBalance } from '@/types/leave';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  showEmployee?: boolean;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  balance,
  showEmployee = false
}) => {
  const utilizationPercentage = balance.earned_days > 0 
    ? Math.round((balance.used_days / balance.earned_days) * 100)
    : 0;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-green-600';
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 80) return { text: 'High', color: 'bg-red-100 text-red-700 border-red-200' };
    if (percentage >= 60) return { text: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { text: 'Low', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const status = getUtilizationStatus(utilizationPercentage);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{balance.leave_type_name}</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              {balance.leave_type_code}
            </Badge>
          </div>
          <Badge className={`${status.color} border`}>
            {status.text}
          </Badge>
        </div>
        {showEmployee && balance.employee_name && (
          <p className="text-sm text-muted-foreground mt-2">{balance.employee_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Earned</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{Number(balance.earned_days).toFixed(1)}</p>
          </div>
          <div className="space-y-1 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Available</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{Number(balance.current_balance).toFixed(1)}</p>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Usage</span>
            <span className={`font-semibold ${getUtilizationColor(utilizationPercentage)}`}>
              {Number(balance.used_days).toFixed(1)}/{Number(balance.earned_days).toFixed(1)} ({utilizationPercentage}%)
            </span>
          </div>
          <Progress value={utilizationPercentage} className="h-2" />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Used</p>
            <p className="text-sm font-semibold text-orange-600">{Number(balance.used_days).toFixed(1)}</p>
          </div>
          <div className="text-center border-x">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-sm font-semibold text-yellow-600">{Number(balance.pending_days).toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Monetized</p>
            <p className="text-sm font-semibold text-purple-600">{Number(balance.monetized_days).toFixed(1)}</p>
          </div>
        </div>

        {/* Additional Info */}
        {balance.carried_forward > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>Carried forward: <span className="font-semibold text-foreground">{Number(balance.carried_forward).toFixed(1)}</span> days</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;