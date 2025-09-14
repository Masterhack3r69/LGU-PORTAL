import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 80) return { text: 'High Usage', color: 'bg-red-100 text-red-800' };
    if (percentage >= 60) return { text: 'Medium Usage', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low Usage', color: 'bg-green-100 text-green-800' };
  };

  const status = getUtilizationStatus(utilizationPercentage);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{balance.leave_type_name}</CardTitle>
          <Badge className={status.color}>
            {status.text}
          </Badge>
        </div>
        {showEmployee && balance.employee_name && (
          <p className="text-sm text-muted-foreground">{balance.employee_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Earned Days</p>
            <p className="text-2xl font-bold">{balance.earned_days}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-primary">{balance.current_balance}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage Progress</span>
            <span className={getUtilizationColor(utilizationPercentage)}>
              {balance.used_days}/{balance.earned_days} days ({utilizationPercentage}%)
            </span>
          </div>
          <Progress value={utilizationPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-semibold">{balance.used_days}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pending</p>
            <p className="font-semibold">{balance.pending_days}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monetized</p>
            <p className="font-semibold">{balance.monetized_days}</p>
          </div>
        </div>

        {balance.carried_forward > 0 && (
          <div className="text-xs text-muted-foreground">
            Carried forward: {balance.carried_forward} days
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;