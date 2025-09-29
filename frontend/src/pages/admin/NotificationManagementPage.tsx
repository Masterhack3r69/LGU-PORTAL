import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Send, 
  TestTube, 
  BarChart3, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import notificationService from '@/services/notificationService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationStats {
  typeStats: Array<{ type: string; type_count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

export function NotificationManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    recipientIds: [] as number[]
  });
  const [testEmployeeId, setTestEmployeeId] = useState('');
  const [testNotificationType, setTestNotificationType] = useState('system_announcement');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await notificationService.getNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setIsLoading(true);
      await notificationService.createTestNotification();
      toast.success('Test notification sent successfully!');
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSpecificTest = async (type: string) => {
    try {
      setIsLoading(true);
      
      const testMessages = {
        leave_approved: {
          title: 'Leave Application Approved',
          message: 'Your leave application for Annual Leave from 2024-01-15 to 2024-01-20 has been approved.',
          priority: 'HIGH' as const
        },
        payroll_generated: {
          title: 'Payroll Generated',
          message: 'Your payroll for January 2024 has been generated and is ready for review.',
          priority: 'MEDIUM' as const
        },
        benefit_processed: {
          title: 'Benefit Processed',
          message: 'Your Terminal Leave benefit has been processed. Amount: ₱25,000.00',
          priority: 'MEDIUM' as const
        },
        payroll_paid: {
          title: 'Payroll Payment Processed',
          message: 'Your payroll for January 2024 has been processed and payment has been released.',
          priority: 'HIGH' as const
        }
      };

      const testData = testMessages[type as keyof typeof testMessages];
      if (testData) {
        await notificationService.createAnnouncement({
          title: `[TEST] ${testData.title}`,
          message: testData.message,
          priority: testData.priority,
          recipientIds: [] // Send to all users
        });
        toast.success(`Test ${type} notification sent!`);
      }
    } catch (error) {
      toast.error(`Failed to send ${type} test notification`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcement.title.trim() || !announcement.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const result = await notificationService.createAnnouncement({
        title: announcement.title,
        message: announcement.message,
        priority: announcement.priority,
        recipientIds: announcement.recipientIds.length > 0 ? announcement.recipientIds : undefined
      });
      
      toast.success(`Announcement sent to ${result.recipientCount} users!`);
      setAnnouncement({
        title: '',
        message: '',
        priority: 'MEDIUM',
        recipientIds: []
      });
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to send announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanOldNotifications = async () => {
    try {
      setIsLoading(true);
      const deletedCount = await notificationService.cleanOldNotifications(90);
      toast.success(`Cleaned ${deletedCount} old notifications`);
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to clean old notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmployeeNotification = async () => {
    if (!testEmployeeId) {
      toast.error('Please enter an employee ID');
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);
      
      const result = await notificationService.testEmployeeNotification(
        parseInt(testEmployeeId),
        testNotificationType
      );
      
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = 'Failed to send test notification to employee';
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system notifications and announcements
          </p>
        </div>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Notifications
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Test Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-green-600" />
                  Test Notification
                </CardTitle>
                <CardDescription>
                  Send a test notification to yourself to verify the system is working
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSendTestNotification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* System Announcement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  System Announcement
                </CardTitle>
                <CardDescription>
                  Send announcements to all users or specific recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={announcement.title}
                      onChange={(e) => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter announcement title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={announcement.message}
                      onChange={(e) => setAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter announcement message"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={announcement.priority} 
                      onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => 
                        setAnnouncement(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor('LOW')}>LOW</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor('MEDIUM')}>MEDIUM</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor('HIGH')}>HIGH</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="URGENT">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor('URGENT')}>URGENT</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      If no specific recipients are selected, the announcement will be sent to all active users.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Announcement
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Notification Types (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.typeStats && stats.typeStats.length > 0 ? (
                  <div className="space-y-3">
                    {stats.typeStats.map((stat) => (
                      <div key={stat.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">
                            {notificationService.getNotificationIcon(stat.type)}
                          </div>
                          <span className="font-medium">
                            {notificationService.getTypeDisplayName(stat.type)}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-semibold">
                          {stat.type_count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No notification data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Recent Activity (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity) => (
                      <div key={activity.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="font-semibold">
                          {activity.count} notifications
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={fetchStats}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Statistics
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Employee Notification Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  Employee Notification Test
                </CardTitle>
                <CardDescription>
                  Test notifications for specific employees to verify they can receive messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-employee-id">Employee ID</Label>
                  <Input
                    id="test-employee-id"
                    type="number"
                    placeholder="Enter employee ID"
                    value={testEmployeeId}
                    onChange={(e) => setTestEmployeeId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-notification-type">Notification Type</Label>
                  <Select 
                    value={testNotificationType} 
                    onValueChange={setTestNotificationType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_announcement">System Announcement</SelectItem>
                      <SelectItem value="leave_approved">Leave Approved</SelectItem>
                      <SelectItem value="payroll_generated">Payroll Generated</SelectItem>
                      <SelectItem value="benefit_processed">Benefit Processed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleTestEmployeeNotification}
                  disabled={isLoading || !testEmployeeId}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test to Employee
                    </>
                  )}
                </Button>

                {testResult && (
                  <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testResult.message}
                      {testResult.data && (
                        <div className="mt-2 text-sm">
                          <strong>Employee:</strong> {testResult.data.employee_name}<br/>
                          <strong>User ID:</strong> {testResult.data.user_id}<br/>
                          <strong>Type:</strong> {testResult.data.notification_type}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Cleanup Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Cleanup Operations
                </CardTitle>
                <CardDescription>
                  Manage and clean up old notifications to optimize system performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently delete notifications older than 90 days. This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleCleanOldNotifications}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Old Notifications (90+ days)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}