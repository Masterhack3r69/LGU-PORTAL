import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";

import { Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import leaveService from "@/services/leaveService";
import { showToast } from "@/lib/toast"
import type { LeaveBalance, LeaveApplication } from "@/types/leave";

interface EmployeeLeaveBalanceProps {
  employeeId: number;
}

const EmployeeLeaveBalance: React.FC<EmployeeLeaveBalanceProps> = ({
  employeeId,
}) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null means all months
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const loadBalances = useCallback(async () => {
    if (!employeeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        `Loading balances for employee ${employeeId}, year ${selectedYear}`
      );
      const data = await leaveService.getLeaveBalances(
        employeeId,
        selectedYear
      );
      console.log("Received balance data:", data);
      setBalances(data || []);
    } catch (error: unknown) {
      console.error("Error loading balances:", error);
      // If it's a 400 error, it might be that the employee has no balances initialized
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 400
      ) {
        showToast.error(
          "No leave balances found. Please contact your administrator to initialize your leave balances."
        );
        setBalances([]);
      } else {
        showToast.error("Failed to load leave balances");
        setBalances([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, selectedYear]);

  const loadLeaveApplications = useCallback(async () => {
    if (!employeeId) {
      setIsLoadingApplications(false);
      return;
    }

    try {
      setIsLoadingApplications(true);

      // If a specific month is selected, filter by that month, otherwise get the whole year
      let startDate, endDate;
      if (selectedMonth !== null) {
        startDate = `${selectedYear}-${(selectedMonth + 1)
          .toString()
          .padStart(2, "0")}-01`;
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        endDate = `${selectedYear}-${(selectedMonth + 1)
          .toString()
          .padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;
      } else {
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      }

      const response = await leaveService.getLeaveApplications({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        page: 1,
        limit: 1000, // Get all applications for the period
      });

      setLeaveApplications(response.applications || []);
    } catch (error: unknown) {
      console.error("Error loading leave applications:", error);
      setLeaveApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  }, [employeeId, selectedYear, selectedMonth]);

  useEffect(() => {
    if (employeeId) {
      loadBalances();
      loadLeaveApplications();
    }
  }, [employeeId, loadBalances, loadLeaveApplications]);

  // Helper function to get leave applications for a specific date
  const getLeaveApplicationsForDate = (date: Date): LeaveApplication[] => {
    return leaveApplications.filter((app) => {
      const startDate = parseISO(app.start_date);
      const endDate = parseISO(app.end_date);

      // Ensure we include both start and end dates (inclusive)
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  // Helper function to get the primary leave status for a date (highest priority)
  const getPrimaryLeaveStatus = (date: Date): string | null => {
    const apps = getLeaveApplicationsForDate(date);
    if (apps.length === 0) return null;

    // Priority order: Approved > Pending > Rejected > Cancelled
    const statusPriority = {
      Approved: 1,
      Pending: 2,
      Rejected: 3,
      Cancelled: 4,
    };

    return apps.reduce((primary, app) => {
      if (
        !primary ||
        statusPriority[app.status] < statusPriority[primary.status]
      ) {
        return app;
      }
      return primary;
    }).status;
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

  if (isLoading || isLoadingApplications) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            Loading balances and leave applications...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year and Month Selector */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">
                  Leave Balance {selectedYear}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMonth !== null
                    ? format(new Date(selectedYear, selectedMonth), "MMMM yyyy")
                    : "All months"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {/* Year Selector */}
              <div className="flex-1 sm:w-32">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Year</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Selector */}
              <div className="flex-1 sm:w-40">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Month</label>
                <Select
                  value={
                    selectedMonth === null ? "all" : selectedMonth.toString()
                  }
                  onValueChange={(value) =>
                    setSelectedMonth(value === "all" ? null : parseInt(value))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {format(new Date(2024, i), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout: Cards Grid + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: 3x2 Grid of Cards */}
        <div className="lg:col-span-2">
          {balances.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No leave balances found for {selectedYear}. Contact your
                  administrator to initialize your balances.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <Card
                  key={balance.id}
                  className="hover:shadow-md transition-shadow"
                >
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
                        <div className="text-lg font-semibold text-blue-600">
                          {Number(balance.earned_days || 0).toFixed(1)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Earned
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {Number(balance.used_days || 0).toFixed(1)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Used
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">
                          {Number(balance.pending_days || 0).toFixed(1)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Pending
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {Number(balance.current_balance || 0).toFixed(1)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Available
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>
                          Usage: {Number(balance.used_days || 0).toFixed(1)} /{" "}
                          {Number(balance.earned_days || 0).toFixed(1)} days
                        </span>
                        <span>
                          {Math.round(
                            ((Number(balance.used_days) || 0) /
                              (Number(balance.earned_days) || 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          ((Number(balance.used_days) || 0) /
                            (Number(balance.earned_days) || 1)) *
                          100
                        }
                        className="h-1"
                      />
                    </div>

                    {/* Additional Info */}
                    {(Number(balance.carried_forward || 0) > 0 ||
                      Number(balance.monetized_days || 0) > 0) && (
                      <div className="flex justify-between text-xs pt-2 border-t">
                        {Number(balance.carried_forward || 0) > 0 && (
                          <div className="text-center">
                            <div className="font-medium text-purple-600">
                              {Number(balance.carried_forward || 0).toFixed(1)}
                            </div>
                            <div className="text-muted-foreground">Carried</div>
                          </div>
                        )}
                        {Number(balance.monetized_days || 0) > 0 && (
                          <div className="text-center">
                            <div className="font-medium text-indigo-600">
                              {Number(balance.monetized_days || 0).toFixed(1)}
                            </div>
                            <div className="text-muted-foreground">
                              Monetized
                            </div>
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
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-0 scale-130 transform-gpu"
                  showOutsideDays={false}
                  month={
                    selectedMonth !== null
                      ? new Date(selectedYear, selectedMonth)
                      : undefined
                  }
                  onMonthChange={(month) => {
                    // Update selected month when user navigates calendar
                    if (selectedMonth !== null) {
                      setSelectedMonth(month.getMonth());
                    }
                  }}
                  modifiers={{
                    // Primary status modifiers (highest priority wins)
                    hasApprovedLeave: (date) =>
                      getPrimaryLeaveStatus(date) === "Approved",
                    hasPendingLeave: (date) =>
                      getPrimaryLeaveStatus(date) === "Pending",
                    hasRejectedLeave: (date) =>
                      getPrimaryLeaveStatus(date) === "Rejected",
                    hasCancelledLeave: (date) =>
                      getPrimaryLeaveStatus(date) === "Cancelled",

                    // Additional modifiers for comprehensive coverage
                    hasAnyLeave: (date) =>
                      getLeaveApplicationsForDate(date).length > 0,
                    hasMultipleLeaves: (date) =>
                      getLeaveApplicationsForDate(date).length > 1,
                  }}
                  modifiersClassNames={{
                    hasApprovedLeave:
                      "bg-green-100 text-green-900 font-semibold border-green-300 border-2",
                    hasPendingLeave:
                      "bg-yellow-100 text-yellow-900 font-semibold border-yellow-300 border-2",
                    hasRejectedLeave:
                      "bg-red-100 text-red-900 font-semibold border-red-300 border-2",
                    hasCancelledLeave:
                      "bg-gray-100 text-gray-900 font-semibold border-gray-300 border-2",
                    hasMultipleLeaves: "ring-2 ring-blue-400 ring-offset-1",
                  }}
                />
              </div>

              {/* Enhanced leave applications list for selected date */}
              {selectedDate &&
                getLeaveApplicationsForDate(selectedDate).length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2 flex items-center justify-between">
                      <span>
                        Leave on {format(selectedDate, "MMM dd, yyyy")}:
                      </span>
                      {getLeaveApplicationsForDate(selectedDate).length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {getLeaveApplicationsForDate(selectedDate).length}{" "}
                          leaves
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {getLeaveApplicationsForDate(selectedDate).map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col space-y-1 p-2 rounded border-l-4 border-l-blue-400 bg-background"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {app.leave_type_name}
                            </span>
                            <Badge
                              variant={
                                app.status === "Approved"
                                  ? "default"
                                  : app.status === "Pending"
                                  ? "secondary"
                                  : app.status === "Rejected"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {app.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div>
                              Duration:{" "}
                              {format(parseISO(app.start_date), "MMM dd")} -{" "}
                              {format(parseISO(app.end_date), "MMM dd")}
                            </div>
                            <div>Days: {app.days_requested}</div>
                            {app.reason && (
                              <div className="mt-1">
                                Reason:{" "}
                                {app.reason.length > 60
                                  ? `${app.reason.substring(0, 60)}...`
                                  : app.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


            </CardContent>
            <CardFooter className="pt-0 border-t">
              <div className="w-full">
                <div className="text-xs font-medium mb-2">
                  Leave Status Legend:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Rejected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span>Cancelled</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  • Blue ring indicates multiple leaves on same day
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveBalance;
