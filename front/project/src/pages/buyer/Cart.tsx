import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('CashOnDelivery');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // Store the selected payment method in session storage
      sessionStorage.setItem('selectedPaymentMethod', paymentMethod);
      
      // Always navigate to checkout page first
      navigate('/checkout');
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Shopping Cart</h1>
        <Link to="/products" className="flex items-center text-purple-600 hover:text-purple-800">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Continue Shopping
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl font-medium text-gray-600 mb-4">Your cart is empty</p>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-24 sm:h-24 h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div className="sm:ml-6 mt-4 sm:mt-0 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                          </div>
                          <p className="text-lg font-medium text-gray-900">LKR{item.product.price.toFixed(2)}</p>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="mx-2 text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center">
                            <p className="text-lg font-medium text-gray-900 mr-4">
                              LKR{(item.product.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-500 hover:text-red-700"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="text-gray-900 font-medium">LKR{totalPrice.toFixed(2)}</p>
                </div>
                
                <div className="flex justify-between">
                  <p className="text-gray-600">Shipping</p>
                  <p className="text-gray-900 font-medium">Free</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <p className="text-lg font-medium text-gray-900">Total</p>
                    <p className="text-lg font-bold text-gray-900">LKR{totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CashOnDelivery"
                      checked={paymentMethod === 'CashOnDelivery'}
                      onChange={() => setPaymentMethod('CashOnDelivery')}
                      className="h-4 w-4 text-purple-600"
                    />
                    <Truck className="h-5 w-5 ml-3 text-gray-400" />
                    <span className="ml-3 text-gray-700">Cash on Delivery</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Stripe"
                      checked={paymentMethod === 'Stripe'}
                      onChange={() => setPaymentMethod('Stripe')}
                      className="h-4 w-4 text-purple-600"
                    />
                    <CreditCard className="h-5 w-5 ml-3 text-gray-400" />
                    <span className="ml-3 text-gray-700">Credit Card</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full mt-6 bg-purple-600 text-white py-3 px-4 rounded-md flex items-center justify-center hover:bg-purple-700 disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;