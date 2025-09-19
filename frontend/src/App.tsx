import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage';
import { EmployeeCreatePage } from '@/pages/employees/EmployeeCreatePage';
import { EmployeeEditPage } from '@/pages/employees/EmployeeEditPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DocumentManagementPage } from '@/pages/employees/DocumentManagementPage';
import { DocumentTypesManagement } from '@/components/admin/DocumentTypesManagement';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NotAuthorized } from '@/components/NotAuthorized';

// Leave Management Pages
import { LeaveManagementPage } from '@/pages/leaves/LeaveManagementPage';
import { EmployeeLeaveManagementPage } from '@/pages/leaves/EmployeeLeaveManagementPage';
import { LeaveApplicationsPage } from '@/pages/leaves/LeaveApplicationsPage';
import { LeaveBalancesPage } from '@/pages/leaves/LeaveBalancesPage';
import { LeaveApprovalsPage } from '@/pages/leaves/LeaveApprovalsPage';
import { LeaveTypesPage } from '@/pages/leaves/LeaveTypesPage';
import { TLBManagementPage } from '@/pages/TLBManagementPage';

// Training Management Pages
import AdminTrainingPage from '@/pages/training/AdminTrainingPage';
import EmployeeTrainingPage from '@/pages/training/EmployeeTrainingPage';
import AdminTrainingRecordsPage from '@/pages/training/AdminTrainingRecordsPage';
import AdminTrainingProgramsPage from '@/pages/training/AdminTrainingProgramsPage';
import AdminTrainingAnalyticsPage from '@/pages/training/AdminTrainingAnalyticsPage';
import EmployeeMyTrainingsPage from '@/pages/training/EmployeeMyTrainingsPage';
import EmployeeCertificatesPage from '@/pages/training/EmployeeCertificatesPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';

// Payroll Management Pages
import { AdminPayrollPage } from '@/pages/payroll/AdminPayrollPage';
import { EmployeePayrollPage } from '@/pages/payroll/EmployeePayrollPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<NotAuthorized />} />
      
      {/* Protected routes */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard - accessible to all authenticated users */}
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Employee Management - Admin only for creation/editing, both roles for viewing */}
        <Route path="employees">
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <EmployeeListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="new" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmployeeCreatePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path=":id/edit" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmployeeEditPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="documents" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DocumentManagementPage />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Leave Management - accessible to all authenticated users */}
        <Route path="leaves">
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <LeaveManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="employee" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeLeaveManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="applications" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <LeaveApplicationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="balances" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <LeaveBalancesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="approvals" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LeaveApprovalsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="types" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LeaveTypesPage />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Training Management - accessible to all authenticated users */}
        <Route path="training">
          {/* Admin Training Routes */}
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTrainingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="records" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTrainingRecordsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="programs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTrainingProgramsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTrainingAnalyticsPage />
              </ProtectedRoute>
            } 
          />
          {/* Employee Training Routes */}
          <Route 
            path="employee" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeTrainingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="my-trainings" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeMyTrainingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="certificates" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeCertificatesPage />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Payroll Management - accessible to all authenticated users */}
        <Route path="payroll">
          {/* Admin Payroll Routes */}
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPayrollPage />
              </ProtectedRoute>
            } 
          />
          {/* Employee Payroll Routes */}
          <Route 
            path="employee" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeePayrollPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Terminal Leave Benefits - Admin only */}
        <Route 
          path="tlb" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TLBManagementPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Document Management - accessible to all authenticated users */}
        <Route 
          path="documents" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <div>Documents - Coming Soon</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Reports - accessible to all authenticated users */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <div>Reports - Coming Soon</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Profile Page - accessible to all authenticated users */}
        <Route 
          path="profile" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Document Management */}
        <Route 
          path="admin/documents" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DocumentManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="admin/document-types" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DocumentTypesManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* System Administration - Admin only */}
        <Route path="admin">
          <Route 
            path="audit" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Admin Panel - Coming Soon</div>
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Settings - accessible to all authenticated users */}
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <div>Settings - Coming Soon</div>
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
