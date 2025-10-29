import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LeaveManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/leaves/applications', { replace: true });
    } else {
      navigate('/leaves/employee', { replace: true });
    }
  }, [user, navigate]);

  return null;
};