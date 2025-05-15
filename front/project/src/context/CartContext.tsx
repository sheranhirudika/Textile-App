import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      localStorage.removeItem('cart');
    } finally {
      setIsInitialized(true);
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Only save to localStorage after initial load is complete
    if (isInitialized) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        // Log for debugging
        console.log('Cart saved to localStorage:', cartItems);
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [cartItems, isInitialized]);
  
  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    
    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedItems = [...cartItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Check if we have enough stock
      if (newQuantity > product.stock) {
        toast.error('Not enough items in stock');
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      setCartItems(updatedItems);
    } else {
      // Add new item if product not in cart
      if (quantity > product.stock) {
        toast.error('Not enough items in stock');
        return;
      }
      
      setCartItems(prevItems => [...prevItems, { product, quantity }]);
    }
    
    toast.success(`${product.name} added to cart`);
    
    // For debugging
    console.log('Product added to cart:', product.name, 'Quantity:', quantity);
  };
  
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast.success('Item removed from cart');
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;
    
    // Check if we have enough stock
    if (quantity > item.product.stock) {
      toast.error('Not enough items in stock');
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0
  );
  
  const totalPrice = subtotal; // Assuming subtotal is the total price

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    totalPrice
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}