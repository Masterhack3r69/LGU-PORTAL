import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  TrendingUp,
  FileText,
  Settings,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { AdminDashboardStats } from "@/services/dashboardService";

interface AdminDashboardProps {
  stats: AdminDashboardStats;
  onQuickAction: (action: string) => void;
}

export function AdminDashboard({ stats, onQuickAction }: AdminDashboardProps) {
  // Chart data
  const monthlyData = [
    {
      name: "Employees",
      value: stats.monthlyStats.newEmployees,
      color: "#3b82f6",
    },
    {
      name: "Leave Apps",
      value: stats.monthlyStats.leaveApplications,
      color: "#10b981",
    },
    {
      name: "Trainings",
      value: stats.monthlyStats.completedTrainings,
      color: "#f59e0b",
    },
  ];

  const employeeStatusData = [
    {
      name: "Active",
      value: Number(stats.employmentStatusBreakdown?.active || stats.activeEmployees || 0),
      color: "#10b981",
    },
    {
      name: "Retired",
      value: Number(stats.employmentStatusBreakdown?.retired || 0),
      color: "#3b82f6",
    },
    {
      name: "Resigned",
      value: Number(stats.employmentStatusBreakdown?.resigned || 0),
      color: "#f59e0b",
    },
    {
      name: "Terminated",
      value: Number(stats.employmentStatusBreakdown?.terminated || 0),
      color: "#ef4444",
    },
    {
      name: "AWOL",
      value: Number(stats.employmentStatusBreakdown?.awol || 0),
      color: "#8b5cf6",
    },
  ];

  // Filter data for chart to only include non-zero values
  const chartData = employeeStatusData.filter(item => item.value > 0);


  const getActivityIcon = (type: string) => {
    switch (type) {
      case "employee":
        return <Users className="h-4 w-4" />;
      case "leave":
        return <Calendar className="h-4 w-4" />;
      case "training":
        return <FileText className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "employee":
        return "bg-blue-100 text-blue-600";
      case "leave":
        return "bg-green-100 text-green-600";
      case "training":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatActivityTitle = (title: string) => {
    // Clean up technical titles to be more user-friendly
    return title
      .replace(/CREATE_POST_/g, "Created ")
      .replace(/UPDATE_POST_/g, "Updated ")
      .replace(/DELETE_POST_/g, "Deleted ")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <>
      {/* Admin Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingLeaveApplications}
            </div>
            <p className="text-xs text-muted-foreground">leave applications</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.systemHealth === "good"
                  ? "text-green-600"
                  : stats.systemHealth === "warning"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {stats.systemHealth === "good"
                ? "Good"
                : stats.systemHealth === "warning"
                ? "Warning"
                : "Critical"}
            </div>
            <p className="text-xs text-muted-foreground">
              all systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>
              Overview of this month's activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Status</CardTitle>
            <CardDescription>Employee status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {employeeStatusData.map((entry) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyStats.newEmployees}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Leave Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyStats.leaveApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              processed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Training Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyStats.completedTrainings}
            </div>
            <p className="text-xs text-muted-foreground">sessions this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions and Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Administrative tasks and management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => onQuickAction("manage-employees")}
            >
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              <span className="font-medium">Manage Employees</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors"
              onClick={() => onQuickAction("approve-leaves")}
            >
              <Calendar className="mr-2 h-4 w-4 text-green-600" />
              <span className="font-medium">Approve Leave Applications</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors"
              onClick={() => onQuickAction("view-reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4 text-orange-600" />
              <span className="font-medium">View Reports & Analytics</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent System Activities</span>
            </CardTitle>
            <CardDescription>
              Latest actions and updates across the system
            </CardDescription>
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
                          activity.type
                        )}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {formatActivityTitle(activity.title)}
                          </p>
                          <Badge variant="outline" className="text-xs ml-2">
                            {activity.timestamp}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                        {activity.user && (
                          <div className="flex items-center mt-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {activity.user.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                by {activity.user}
                              </span>
                            </div>
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
                      System activities will appear here
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
