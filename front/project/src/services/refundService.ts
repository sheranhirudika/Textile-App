// services/refundService.ts
import axios from 'axios';

import { ApiResponse } from '../types/apiTypes';


const API_URL = import.meta.env.VITE_API_URL  || 'http://localhost:5000/api';
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  };
  
export interface Refund {
  _id: string;
  order: string | { _id: string };
  user: { _id: string; name: string; email: string };
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export async function getMyRefunds(): Promise<Refund[]> {
  try {
    const response = await axios.get<ApiResponse<Refund[]>>(
      `${API_URL}/refunds/`,
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching my refunds:', error);
    throw error;
  }
}

export async function requestRefund(orderId: string, reason: string): Promise<Refund> {
  try {
    const response = await axios.post<ApiResponse<Refund>>(
      `${API_URL}/refunds/`,
      { orderId, reason },
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
}