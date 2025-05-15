/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User } from '../types';
import { loginUser, registerUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDelivery: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Add another useEffect to handle redirection based on auth status
  useEffect(() => {
    // Skip during initial loading
    if (loading) return;
    
    const currentPath = location.pathname;
    
    // Define public routes that don't require authentication
    const publicRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/products',
      '/cart'
    ];
    
    // Check if current path is a reset-password path
    const isResetPasswordRoute = currentPath.startsWith('/reset-password/');
    
    // If user is authenticated but on login or register page, redirect to their dashboard
    if (token && user && (currentPath === '/login' || currentPath === '/register' || currentPath === '/')) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'delivery') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
    }
    // If user is not authenticated and not on public routes, redirect to login
    else if (!token && 
             !publicRoutes.some(route => currentPath.startsWith(route)) && 
             !isResetPasswordRoute) {
      navigate('/login');
    }
  }, [token, user, loading, navigate, location]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await loginUser(email, password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'delivery') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
      
      toast.success('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name: string, email: string, password: string, role = 'buyer') => {
    try {
      setLoading(true);
      const response = await registerUser(name, email, password, role);
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  const isDelivery = user?.role === 'delivery';

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isDelivery, 
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}