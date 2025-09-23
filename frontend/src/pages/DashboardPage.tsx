
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  FileText, 
  Award, 
  User,
  CheckCircle 
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || user?.username}!
          </p>
        </div>
        <Badge variant="default">
          {user?.role === 'admin' ? 'Administrator' : 'Employee'}
        </Badge>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leave Balance
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              days remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Benefits
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              active trainings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Completion
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              profile complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Leave application approved
                </p>
                <p className="text-sm text-muted-foreground">
                  Your vacation leave for next week has been approved
                </p>
              </div>
              <div className="text-sm text-muted-foreground">2h ago</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Document uploaded
                </p>
                <p className="text-sm text-muted-foreground">
                  Medical certificate uploaded for review
                </p>
              </div>
              <div className="text-sm text-muted-foreground">1d ago</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Profile updated
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact information has been updated
                </p>
              </div>
              <div className="text-sm text-muted-foreground">3d ago</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="flex items-center justify-start space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Apply for Leave</p>
                  <p className="text-xs text-muted-foreground">Submit a new leave request</p>
                </div>
              </button>
              
              <button className="flex items-center justify-start space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted">
                <FileText className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">Add new documents to your profile</p>
                </div>
              </button>
              
              <button className="flex items-center justify-start space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Update Profile</p>
                  <p className="text-xs text-muted-foreground">Edit your personal information</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}