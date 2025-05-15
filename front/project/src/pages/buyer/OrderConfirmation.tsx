import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, ShoppingBag } from 'lucide-react';

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, message, paymentMethod } = location.state || {};
  
  // Redirect if accessed directly without state
  useEffect(() => {
    if (!success) {
      navigate('/');
    }
  }, [success, navigate]);

  const handleContinueShopping = () => {
    navigate('/products');
  };
  
  const handleViewOrders = () => {
    navigate('/my-orders');
  };

  if (!success) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">{message || 'Thank you for your order.'}</p>
        
        <div className="w-full max-w-md bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            {paymentMethod === 'CashOnDelivery' ? (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600">
                <Truck className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium text-center mb-2">
            {paymentMethod === 'CashOnDelivery' 
              ? 'Cash on Delivery Order' 
              : 'Payment Completed'}
          </h3>
          
          {paymentMethod === 'CashOnDelivery' && (
            <p className="text-gray-500 text-center mb-4">
              Please have the payment ready when your order arrives.
            </p>
          )}
          
          <div className="bg-white p-4 rounded border border-gray-200">
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>We've received your order</span>
              </li>
              <li className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>You'll receive an email confirmation shortly</span>
              </li>
              <li className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Your order is being processed</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={handleViewOrders}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            View My Orders
          </button>
          <button 
            onClick={handleContinueShopping}
            className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;