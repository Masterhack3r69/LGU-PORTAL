import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminTrainingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to training records as the default admin training page
    navigate('/training/records', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminTrainingPage;