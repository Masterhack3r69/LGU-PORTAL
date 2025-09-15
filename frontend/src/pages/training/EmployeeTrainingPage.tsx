import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeTrainingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to my trainings as the default employee training page
    navigate('/training/my-trainings', { replace: true });
  }, [navigate]);

  return null;
};

export default EmployeeTrainingPage;