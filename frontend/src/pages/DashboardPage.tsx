
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
          // Fetch admin dashboard data
          const stats = await dashboardService.getAdminDashboardStats();
          console.log('Admin dashboard stats:', stats);
          setAdminStats(stats);
        } else {
          // Fetch employee dashboard data
          const stats = await dashboardService.getEmployeeDashboardStats(user?.employee_id);
          console.log('Employee dashboard stats:', stats);
          setEmployeeStats(stats);
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