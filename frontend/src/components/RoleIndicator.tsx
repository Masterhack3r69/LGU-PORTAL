import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';

export const RoleIndicator: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border">
      {isAdmin ? (
        <Shield className="h-4 w-4 text-blue-600" />
      ) : (
        <User className="h-4 w-4 text-green-600" />
      )}
      <span className="text-sm font-medium">{user.full_name}</span>
      <Badge variant={isAdmin ? 'default' : 'secondary'}>
        {isAdmin ? 'Administrator' : 'Employee'}
      </Badge>
    </div>
  );
};