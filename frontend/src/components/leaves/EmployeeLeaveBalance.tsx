import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import leaveService from '@/services/leaveService';
import { toast } from 'sonner';
import type { LeaveBalance } from '@/types/leave';

interface EmployeeLeaveBalanceProps {
  employeeId: number;
}

const EmployeeLeaveBalance: React.FC<EmployeeLeaveBalanceProps> = ({
  employeeId
}) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (employeeId) {
      loadBalances();
    }
  }, [employeeId, selectedYear]);

  const loadBalances = async () => {
    if (!employeeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Loading balances for employee ${employeeId}, year ${selectedYear}`);
      const data = await leaveService.getLeaveBalances(employeeId, selectedYear);
      console.log('Received balance data:', data);
      setBalances(data || []);
    } catch (error: unknown) {
      console.error('Error loading balances:', error);
      // If it's a 400 error, it might be that the employee has no balances initialized
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 400) {
        toast.error('No leave balances found. Please contact your administrator to initialize your leave balances.');
        setBalances([]);
      } else {
        toast.error('Failed to load leave balances');
        setBalances([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!employeeId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Employee ID is required to view leave balances.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading balances...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Leave Balance for {selectedYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {[2023, 2024, 2025].map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
                className="h-8"
              >
                {year}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Layout: Cards Grid + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: 3x2 Grid of Cards */}
        <div className="lg:col-span-3">
          {balances.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No leave balances found for {selectedYear}. Contact your administrator to initialize your balances.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <Card key={balance.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {balance.leave_type_name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {balance.leave_type_code}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Balance Overview */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{Number(balance.earned_days || 0).toFixed(1)}</div>
                        <div className="text-muted-foreground text-xs">Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{Number(balance.used_days || 0).toFixed(1)}</div>
                        <div className="text-muted-foreground text-xs">Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">{Number(balance.pending_days || 0).toFixed(1)}</div>
                        <div className="text-muted-foreground text-xs">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{Number(balance.current_balance || 0).toFixed(1)}</div>
                        <div className="text-muted-foreground text-xs">Available</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Usage: {Number(balance.used_days || 0).toFixed(1)} / {Number(balance.earned_days || 0).toFixed(1)} days</span>
                        <span>{Math.round(((Number(balance.used_days) || 0) / (Number(balance.earned_days) || 1)) * 100)}%</span>
                      </div>
                      <Progress 
                        value={((Number(balance.used_days) || 0) / (Number(balance.earned_days) || 1)) * 100} 
                        className="h-1"
                      />
                    </div>

                    {/* Additional Info */}
                    {(Number(balance.carried_forward || 0) > 0 || Number(balance.monetized_days || 0) > 0) && (
                      <div className="flex justify-between text-xs pt-2 border-t">
                        {Number(balance.carried_forward || 0) > 0 && (
                          <div className="text-center">
                            <div className="font-medium text-purple-600">{Number(balance.carried_forward || 0).toFixed(1)}</div>
                            <div className="text-muted-foreground">Carried</div>
                          </div>
                        )}
                        {Number(balance.monetized_days || 0) > 0 && (
                          <div className="text-center">
                            <div className="font-medium text-indigo-600">{Number(balance.monetized_days || 0).toFixed(1)}</div>
                            <div className="text-muted-foreground">Monetized</div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader >
              <CardTitle className="text-base flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-0"
                  showOutsideDays={false}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground text-center">
                Calendar integration coming soon
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveBalance;