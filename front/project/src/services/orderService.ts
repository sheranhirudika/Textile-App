import axios from 'axios';
import { Order, ApiResponse } from '../types';

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

export const createOrder = async (orderData: {
  product: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
};

export async function getOrders(): Promise<Order[]> {
  try {
    const response = await axios.get<ApiResponse<Order[]>>(
      `${API_URL}/orders`,
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getMyOrders(): Promise<Order[]> {
  try {
    const response = await axios.get<ApiResponse<Order[]>>(
      `${API_URL}/orders/myorders`,
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching my orders:', error);
    throw error;
  }
}



export async function updateOrderStatus(
  id: string, 
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<Order> {
  try {
    const response = await axios.put<ApiResponse<Order>>(
      `${API_URL}/orders/status/${id}`,
      { status },
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error updating order status for order ${id}:`, error);
    throw error;
  }
}

export async function markOrderAsPaid(id: string): Promise<Order> {
  try {
    const response = await axios.put<ApiResponse<Order>>(
      `${API_URL}/orders/pay/${id}`,
      {},
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error marking order ${id} as paid:`, error);
    throw error;
  }
}

export async function cancelOrder(id: string): Promise<Order> {
  try {
    const response = await axios.put<ApiResponse<Order>>(
      `${API_URL}/orders/cancel/${id}`,
      {},
      getHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error cancelling order ${id}:`, error);
    throw error;
  }
}

// export const cancelOrder = async (orderId: string) => {
//   const res = await axios.put(`/api/orders/cancel/${orderId}`);
//   return res.data;
// };