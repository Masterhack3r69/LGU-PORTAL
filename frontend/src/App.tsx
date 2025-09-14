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
import { PayrollPage } from '@/pages/PayrollPage';
import { EmployeePayrollPage } from '@/pages/EmployeePayrollPage';
import { BenefitsPage } from '@/pages/BenefitsPage';
import { CompensationPage } from '@/pages/CompensationPage';
import { TLBManagementPage } from '@/pages/TLBManagementPage';

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
        
        {/* Payroll Management - Admin only */}
        <Route 
          path="payroll" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PayrollPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Employee Payroll - Accessible to employees for their own payroll */}
        <Route 
          path="my-payroll" 
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeePayrollPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Benefits - accessible to all authenticated users */}
        <Route 
          path="benefits" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'employee']}>
              <BenefitsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Compensation - Admin only */}
        <Route 
          path="compensation" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompensationPage />
            </ProtectedRoute>
          } 
        />
        
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
        <Route 
          path="admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div>Admin Panel - Coming Soon</div>
            </ProtectedRoute>
          } 
        />
        
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
