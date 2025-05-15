import axios from 'axios';
import { Delivery, Order } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getDeliveryOrders = async (): Promise<Order[]> => {
  try {
    const response = await axios.get(`${API_URL}/deliveries/assigned`, getHeaders());
    return response.data.data;
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    throw error;
  }
};

export const getMyDeliveries = async (): Promise<Delivery[]> => {
    try {
      const response = await axios.get(`${API_URL}/deliveries/`, getHeaders());
      
      // Transform the data to ensure consistent typing
      return response.data.data.map((delivery: Delivery) => ({
        ...delivery,
        order: {
          ...delivery.order,
          // Add any additional transformations if needed
        }
      }));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  };

  export const getDeliveries = async (): Promise<Delivery[]> => {
    try {
      const response = await axios.get(`${API_URL}/deliveries/admin`, getHeaders());
      
      // Transform the data to ensure consistent typing
      return response.data.data.map((delivery: Delivery) => ({
        ...delivery,
        order: {
          ...delivery.order,
          // Add any additional transformations if needed
        }
      }));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  };

// export const updateDeliveryStatus = async (
//   orderId: string, 
//   status: 'in-progress' | 'delivered' | 'failed'
// ): Promise<Order> => {
//   try {
//     const response = await axios.put(
//       `${API_URL}/deliveries/${orderId}/status`,
//       { status },
//       getHeaders()
//     );
//     return response.data.data;
//   } catch (error) {
//     console.error('Error updating delivery status:', error);
//     throw error;
//   }
// };


export const updateDelivery = async (
    deliveryId: string,
    updateData: Partial<Delivery>
  ): Promise<Delivery> => {
    try {
      const response = await axios.put(
        `${API_URL}/deliveries/${deliveryId}`,
        updateData,
        getHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  };

  export const updateDeliveryAdmin = async (
    deliveryId: string,
    updateData: Partial<Delivery>
  ): Promise<Delivery> => {
    try {
      const response = await axios.put(
        `${API_URL}/deliveries/admin/${deliveryId}`,
        updateData,
        getHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  };
  
  export const deleteDelivery = async (deliveryId: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/deliveries/${deliveryId}`, getHeaders());
    } catch (error) {
      console.error('Error deleting delivery:', error);
      throw error;
    }
  };
  
  export const updateDeliveryStatus = async (
      deliveryId: string,
      status: "Pending" | "In Transit" | "Delivered" | "Failed" | undefined
    ): Promise<Delivery> => {
      return updateDelivery(deliveryId, { deliveryStatus: status });
    };


    export const updateDeliveryStatusAdmin = async (
        deliveryId: string,
        status: "Pending" | "In Transit" | "Delivered" | "Failed" | undefined
      ): Promise<Delivery> => {
        return updateDeliveryAdmin(deliveryId, { deliveryStatus: status });
      };


export const updateDeliveryPerson = async (
        deliveryId: string, 
        deliveryPerson: string
      ): Promise<Delivery> => {
        try {
          const response = await axios.put(
            `${API_URL}/deliveries/admin/${deliveryId}`,
            { deliveryPerson },
            getHeaders()
          );
          return response.data.data;
        } catch (error) {
          console.error('Error updating delivery person:', error);
          throw error;
        }
      };