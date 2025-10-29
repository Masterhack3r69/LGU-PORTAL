import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLeaveManagement: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to applications page
    navigate('/leaves/applications', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminLeaveManagement;