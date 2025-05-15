export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
export interface Product {
  id: string;          // Used in frontend
  _id: string;         // From backend
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  imageUrl?: string;   // For frontend display
  createdAt: string;
  updatedAt: string;
}
export interface Order {
  id: string;
  _id: string;
  product: Product;
  orderNumber: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'CashOnDelivery' | 'Stripe';
  isPaid: boolean;
  shippingAddress: Address;
  buyer: User;
  user: User;
  createdAt: string;
}

export interface Delivery {
  _id: string;
  order: {
    _id: string;
    product: string | { _id: string; name: string }; // Can be ID or populated product
    user: string | { _id: string; name: string }; // Can be ID or populated user
    quantity: number;
    totalPrice: number;
    paymentMethod: string;
    isPaid: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
  };
  deliveryPerson: string; // In your case it's just the name "John Doe"
  deliveryStatus: 'Pending' | 'In Transit' | 'Delivered' | 'Failed';
  deliveryDate?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  order: Order;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

