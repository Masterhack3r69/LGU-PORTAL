import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  GraduationCap,
  User,
  DollarSign,
  Award,
  CheckCircle,
  Activity,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { EmployeeDashboardStats } from "@/services/dashboardService";

interface EmployeeDashboardProps {
  stats: EmployeeDashboardStats;
  onQuickAction: (action: string) => void;
}

export function EmployeeDashboard({
  stats,
  onQuickAction,
}: EmployeeDashboardProps) {
  const trainingProgress =
    stats.totalTrainings > 0
      ? Math.round((stats.completedTrainings / stats.totalTrainings) * 100)
      : 0;

  // Chart data
  const trainingData = [
    { name: "Completed", value: stats.completedTrainings, color: "#10b981" },
    {
      name: "Remaining",
      value: stats.totalTrainings - stats.completedTrainings,
      color: "#e5e7eb",
    },
  ];

  const leaveData = [
    { name: "Available", value: stats.totalLeaveBalance, color: "#3b82f6" },
    { name: "Pending", value: stats.pendingApplications, color: "#f59e0b" },
  ];

  const COLORS = ["#10b981", "#e5e7eb", "#3b82f6", "#f59e0b"];

  const getActivityIcon = (type: string, status?: string) => {
    if (type === "leave") {
      if (status === "approved") return <CheckCircle className="h-4 w-4" />;
      if (status === "pending") return <Clock className="h-4 w-4" />;
      return <Calendar className="h-4 w-4" />;
    }
    if (type === "training") return <GraduationCap className="h-4 w-4" />;
    if (type === "payroll") return <DollarSign className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getActivityColor = (type: string, status?: string) => {
    if (type === "leave") {
      if (status === "approved") return "bg-green-100 text-green-600";
      if (status === "pending") return "bg-yellow-100 text-yellow-600";
      return "bg-blue-100 text-blue-600";
    }
    if (type === "training") return "bg-purple-100 text-purple-600";
    if (type === "payroll") return "bg-orange-100 text-orange-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <>
      {/* Employee Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeaveBalance}</div>
            <p className="text-xs text-muted-foreground">days remaining</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Progress
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTrainings} of {stats.totalTrainings} completed
            </p>
            <Progress value={trainingProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Status
            </CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileCompletion}%</div>
            <p className="text-xs text-muted-foreground">profile complete</p>
            <Progress value={stats.profileCompletion} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Your training completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={trainingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {trainingData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {trainingData.map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Overview</CardTitle>
            <CardDescription>
              Your leave balance and applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leaveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Quick Actions and Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => onQuickAction("apply-leave")}
            >
              <Calendar className="mr-2 h-4 w-4 text-blue-600" />
              <span className="font-medium">Apply for Leave</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors"
              onClick={() => onQuickAction("view-payroll")}
            >
              <DollarSign className="mr-2 h-4 w-4 text-green-600" />
              <span className="font-medium">View Payroll</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 transition-colors"
              onClick={() => onQuickAction("view-benefits")}
            >
              <Award className="mr-2 h-4 w-4 text-purple-600" />
              <span className="font-medium">View Benefits</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors"
              onClick={() => onQuickAction("view-training")}
            >
              <GraduationCap className="mr-2 h-4 w-4 text-orange-600" />
              <span className="font-medium">My Training</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              onClick={() => onQuickAction("update-profile")}
            >
              <User className="mr-2 h-4 w-4 text-indigo-600" />
              <span className="font-medium">Update Profile</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-3 py-4">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(
                          activity.type,
                          activity.status
                        )}`}
                      >
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {activity.title}
                          </p>
                          <Badge variant="outline" className="text-xs ml-2">
                            {activity.timestamp}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                        {activity.status && (
                          <div className="flex items-center mt-2">
                            <Badge
                              variant={
                                activity.status === "approved"
                                  ? "default"
                                  : activity.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recent activities
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your activities will appear here
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
