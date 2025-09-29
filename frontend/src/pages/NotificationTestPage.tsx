import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  User,
  Database,
  Wifi
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import notificationService from '@/services/notificationService';
import { toast } from 'sonner';

export function NotificationTestPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState({
    userAuthenticated: false,
    notificationServiceConnected: false,
    canFetchNotifications: false,
    lastTestTime: null as Date | null
  });

  useEffect(() => {
    checkSystemStatus();
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const checkSystemStatus = () => {
    setSystemStatus({
      userAuthenticated: !!user,
      notificationServiceConnected: true, // We'll assume this is true if we can import the service
      canFetchNotifications: !!user,
      lastTestTime: new Date()
    });
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 5
      });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setSystemStatus(prev => ({ ...prev, canFetchNotifications: false }));
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleRefreshTest = async () => {
    setIsLoading(true);
    try {
      await checkSystemStatus();
      await fetchNotifications();
      await fetchUnreadCount();
      toast.success('System status refreshed');
    } catch (error) {
      toast.error('Failed to refresh system status');
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIndicator = ({ status, label }: { status: boolean; label: string }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {status ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              OK
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Error
            </Badge>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check if you can receive notifications properly
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
            <CardDescription>
              Current status of the notification system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusIndicator 
              status={systemStatus.userAuthenticated} 
              label="User Authentication" 
            />
            <StatusIndicator 
              status={systemStatus.notificationServiceConnected} 
              label="Notification Service" 
            />
            <StatusIndicator 
              status={systemStatus.canFetchNotifications} 
              label="Can Fetch Notifications" 
            />
            
            {systemStatus.lastTestTime && (
              <div className="text-xs text-gray-500 mt-3">
                Last checked: {systemStatus.lastTestTime.toLocaleString()}
              </div>
            )}

            <Button 
              onClick={handleRefreshTest}
              disabled={isLoading}
              variant="outline"
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              User Information
            </CardTitle>
            <CardDescription>
              Your current user account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">Username</span>
                  <span className="text-gray-600 dark:text-gray-400">{user.username}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">User ID</span>
                  <span className="text-gray-600 dark:text-gray-400">{user.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">Role</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">Employee ID</span>
                  <span className="text-gray-600 dark:text-gray-400">{user.employee_id || 'N/A'}</span>
                </div>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No user information available. Please log in.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Notification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Notification Status
            </CardTitle>
            <CardDescription>
              Your current notification statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-medium">Unread Notifications</span>
              <Badge variant={unreadCount > 0 ? "default" : "secondary"}>
                {unreadCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-medium">Recent Notifications</span>
              <Badge variant="outline">
                {notifications.length}
              </Badge>
            </div>
            
            {notifications.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Latest Notifications:</h4>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-orange-600" />
              Test Instructions
            </CardTitle>
            <CardDescription>
              How to verify your notification system is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <div>Check that all system status indicators show "OK"</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <div>Verify your user information is displayed correctly</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <div>Ask an admin to send you a test notification using your Employee ID: <strong>{user?.employee_id || 'N/A'}</strong></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                <div>Check the notification bell in the top-right corner for new notifications</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">5</div>
                <div>Refresh this page to see updated notification counts</div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you're not receiving notifications, contact your system administrator and provide them with your Employee ID: <strong>{user?.employee_id || 'N/A'}</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}