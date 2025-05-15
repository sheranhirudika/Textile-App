/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Headers with auth token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
}

export async function createPaymentIntent(amount: number): Promise<PaymentIntent> {
  try {
    // TODO: Uncomment when API is ready
    /*
    const response = await axios.post<ApiResponse<PaymentIntent>>(
      `${API_URL}/api/payments/create-payment-intent`,
      { amount },
      getHeaders()
    );
    return response.data.data;
    */
    
    // Mock response for testing
    // This is just for demonstration - in a real app, the secret would come from the server
    const mockClientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`;
    
    return {
      clientSecret: mockClientSecret,
      amount,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}