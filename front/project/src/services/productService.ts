import axios from 'axios';
import { Product } from '../types';

const API_URL = import.meta.env.VITE_API_URL  || 'http://localhost:5000/api';

// Headers with auth token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

interface ProductResponse {
  message: string;
  data: {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ProductsResponse {
  message: string;
  data: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Helper function to transform backend product data to frontend format
const transformProduct = (productData: ProductResponse['data']): Product => {
  return {
    ...productData,
    id: productData._id, // Map _id to id for frontend use
    imageUrl: productData.image 
      ? `${API_URL}/uploads/${productData.image}` 
      : '/placeholder-image.jpg'
  };
};

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await axios.get<ProductsResponse>(
      `${API_URL}/products`,
      getHeaders()
    );
    console.log('Products response:', API_URL);
    // Transform the backend response to match our frontend Product type
    return response.data.data.map(product => transformProduct(product));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await axios.get<ProductResponse>(
      `${API_URL}/products/${id}`,
      getHeaders()
    );
    
    return transformProduct(response.data.data);
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw new Error('Failed to fetch product details');
  }
}

export async function createProduct(productData: FormData): Promise<Product> {
  try {
    const response = await axios.post<ProductResponse>(
      `${API_URL}/products`,
      productData,
      {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return transformProduct(response.data.data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(id: string, productData: FormData): Promise<Product> {
  try {
    const response = await axios.put<ProductResponse>(
      `${API_URL}/products/${id}`,
      productData,
      {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return transformProduct(response.data.data);
  } catch (error) {
    console.error(`Error updating product with id ${id}:`, error);
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await axios.delete(
      `${API_URL}/products/${id}`,
      getHeaders()
    );
    
    return true;
  } catch (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw new Error('Failed to delete product');
  }
}