/* eslint-disable @typescript-eslint/no-unused-vars */
// src/services/authService.ts
import axios from 'axios';
import { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LoginResponse {
  message: string;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
}

interface RegisterResponse {
  message: string;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
}

// Login user and return user data with token
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    
    const userData = response.data.data;
    
    return {
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: ['admin', 'buyer', 'delivery'].includes(userData.role) ? (userData.role as 'admin' | 'buyer' | 'delivery') : 'buyer',
      },
      token: userData.token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed');
  }
};

// Register user
export const registerUser = async (
  name: string, 
  email: string, 
  password: string, 
  role = 'buyer'
): Promise<{ user: User; token: string }> => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password,
      role,
    });
    
    const userData = response.data.data;
    
    return {
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: ['admin', 'buyer', 'delivery'].includes(userData.role) ? (userData.role as 'admin' | 'buyer' | 'delivery') : 'buyer',
      },
      token: userData.token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error('Registration failed');
  }
};

interface FetchUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const fetchUser = async (id: string): Promise<FetchUserResponse | { message: string }> => {
  const authToken = "admin_access_token";
  
  try {
    const response = await fetch(`/api/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { message: "User not found" };
      }
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return { message: "Failed to fetch user data" };
  }
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/forgot-password`, { email });
  } catch (error) {
    console.error('Password reset request error:', error);
    throw new Error('Failed to request password reset');
  }
};

// Verify password reset token
export const verifyResetToken = async (token: string): Promise<void> => {
  try {
    await axios.get(`${API_URL}/auth/reset-password/${token}/verify`);
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error('Failed to reset password');
  }
};