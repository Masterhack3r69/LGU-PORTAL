export interface User {
  id: number;
  username: string;
  role: 'admin' | 'employee';
  employee_id?: number;
  full_name: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

export interface AuthError {
  message: string;
  code?: string;
}