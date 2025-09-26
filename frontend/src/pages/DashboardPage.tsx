
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle
} from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { dashboardService, type EmployeeDashboardStats, type AdminDashboardStats } from '@/services/dashboardService';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employeeStats, setEmployeeStats] = useState<EmployeeDashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (user?.role === 'admin') {
          // Try to fetch admin dashboard data, fallback to mock data
          try {
            const stats = await dashboardService.getAdminDashboardStats();
            setAdminStats(stats);
          } catch (err) {
            console.warn('Admin dashboard API not available, using mock data:', err);
            // Fallback to mock data with employee count
            const [employeesResponse] = await Promise.all([
              employeeService.getEmployees({ limit: 1 }), // Just get count
            ]);

            setAdminStats({
              totalEmployees: employeesResponse.total,
              activeEmployees: employeesResponse.total,
              pendingLeaveApplications: 0,
              pendingDocuments: 0,
              monthlyPayrollStatus: 'completed',
              systemHealth: 'good',
              employmentStatusBreakdown: {
                active: employeesResponse.total,
                retired: 0,
                resigned: 0,
                terminated: 0,
                awol: 0
              },
              recentActivities: [
                {
                  id: '1',
                  type: 'employee',
                  title: 'New Employee Added',
                  description: 'New employee John Doe was added to the system',
                  timestamp: '2 hours ago',
                  user: 'HR Admin'
                },
                {
                  id: '2',
                  type: 'leave',
                  title: 'Leave Applications',
                  description: '5 leave applications are pending approval',
                  timestamp: '4 hours ago'
                },
                {
                  id: '3',
                  type: 'payroll',
                  title: 'Payroll Completed',
                  description: 'Monthly payroll processing completed',
                  timestamp: '1 day ago'
                }
              ],
              monthlyStats: {
                newEmployees: 3,
                leaveApplications: 12,
                completedTrainings: 25,
                payrollProcessed: true
              }
            });
          }
        } else {
          // Try to fetch employee dashboard data, fallback to mock data
          try {
            const stats = await dashboardService.getEmployeeDashboardStats(user?.id);
            setEmployeeStats(stats);
          } catch (err) {
            console.warn('Employee dashboard API not available, using mock data:', err);
            // Fallback to mock data
            setEmployeeStats({
              totalLeaveBalance: 15,
              pendingApplications: 1,
              completedTrainings: 8,
              totalTrainings: 12,
              profileCompletion: 85,
              recentActivities: [
                {
                  id: '1',
                  type: 'leave',
                  title: 'Leave Application Approved',
                  description: 'Your vacation leave for next week has been approved',
                  timestamp: '2 hours ago',
                  status: 'approved'
                },
                {
                  id: '2',
                  type: 'training',
                  title: 'Training Completed',
                  description: 'Workplace Safety training has been completed',
                  timestamp: '1 day ago',
                  status: 'completed'
                },
                {
                  id: '3',
                  type: 'payroll',
                  title: 'Payslip Available',
                  description: 'Your payslip for this month is now available',
                  timestamp: '3 days ago'
                }
              ]
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'apply-leave':
        navigate('/leaves/employee');
        break;
      case 'upload-document':
        navigate('/profile');
        break;
      case 'update-profile':
        navigate('/profile');
        break;
      case 'view-payroll':
        navigate('/payroll/employee');
        break;
      case 'view-benefits':
        navigate('/benefits/employee');
        break;
      case 'view-training':
        navigate('/training/my-trainings');
        break;
      case 'manage-employees':
        navigate('/employees');
        break;
      case 'approve-leaves':
        navigate('/leaves/approvals');
        break;
      case 'payroll-management':
        navigate('/payroll/periods');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {user?.full_name || user?.username}!
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {user?.full_name || user?.username}!
          </p>
        </div>
      </div>

      {/* Render role-specific dashboard */}
      {user?.role === 'admin' && adminStats && (
        <AdminDashboard stats={adminStats} onQuickAction={handleQuickAction} />
      )}

      {user?.role === 'employee' && employeeStats && (
        <EmployeeDashboard stats={employeeStats} onQuickAction={handleQuickAction} />
      )}
    </div>
  );
}