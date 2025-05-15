/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ArrowLeft, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderService';
import { createPaymentIntent } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface FormErrors {
  fullName?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardName?: string;
}

function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Get payment method from session storage if available
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "CashOnDelivery">(() => {
    const savedMethod = sessionStorage.getItem('selectedPaymentMethod');
    return (savedMethod === 'Card' || savedMethod === 'CashOnDelivery') ? savedMethod : 'CashOnDelivery';
  });
  
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  
  useEffect(() => {
    // Redirect to cart if cart is empty
    if (cartItems.length === 0) {
      navigate('/cart');
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to complete your purchase');
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [cartItems.length, isAuthenticated, navigate]);
  
  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validateFullName = (name: string): string | undefined => {
    if (!name) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validateAddress = (address: string): string | undefined => {
    if (!address) return 'Address is required';
    if (address.trim().length < 5) return 'Please enter a complete address';
    return undefined;
  };

  const validateCity = (city: string): string | undefined => {
    if (!city) return 'City is required';
    if (city.trim().length < 2) return 'City name must be at least 2 characters';
    const cityRegex = /^[a-zA-Z\s'-]+$/;
    if (!cityRegex.test(city)) return 'City name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validatePostalCode = (postalCode: string): string | undefined => {
    if (!postalCode) return 'Postal code is required';
    // Basic postal code validation (alphanumeric, 3-10 characters)
    const postalRegex = /^[a-zA-Z0-9\s-]{3,10}$/;
    if (!postalRegex.test(postalCode)) return 'Please enter a valid postal code';
    return undefined;
  };

  const validateCountry = (country: string): string | undefined => {
    if (!country) return 'Country is required';
    if (country.trim().length < 2) return 'Country name must be at least 2 characters';
    const countryRegex = /^[a-zA-Z\s'-]+$/;
    if (!countryRegex.test(country)) return 'Country name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validateCardName = (cardName: string): string | undefined => {
    if (!cardName) return 'Name on card is required';
    if (cardName.trim().length < 2) return 'Name must be at least 2 characters';
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(cardName)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  // Enhanced card validation functions
  const validateCardNumber = (cardNumber: string): string | undefined => {
    const digitsOnly = cardNumber.replace(/\D/g, '');
    if (!cardNumber) return 'Card number is required';
    if (digitsOnly.length !== 16) return 'Card number must be 16 digits';
    
    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;
    
    for (let i = digitsOnly.length - 1; i >= 0; i--) {
      let digit = parseInt(digitsOnly.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) return 'Please enter a valid card number';
    return undefined;
  };

  const validateCardExpiry = (expiry: string): string | undefined => {
    if (!expiry) return 'Expiry date is required';
    
    // Check format
    if (!expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      return 'Please enter expiry date in MM/YY format';
    }
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);
    
    // Check if card is expired
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return 'Card has expired';
    }
    
    return undefined;
  };

  const validateCardCvc = (cvc: string): string | undefined => {
    if (!cvc) return 'CVC is required';
    if (!/^[0-9]{3,4}$/.test(cvc)) return 'CVC must be 3-4 digits';
    return undefined;
  };

  // Handle field validation on change
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'address':
        return validateAddress(value);
      case 'city':
        return validateCity(value);
      case 'postalCode':
        return validatePostalCode(value);
      case 'country':
        return validateCountry(value);
      case 'cardName':
        return validateCardName(value);
      case 'cardNumber':
        return validateCardNumber(value);
      case 'cardExpiry':
        return validateCardExpiry(value);
      case 'cardCvc':
        return validateCardCvc(value);
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date as MM/YY
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  // Validate all fields
  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate shipping information
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    // Validate card details if payment method is Card
    if (paymentMethod === 'Card') {
      Object.entries(cardDetails).forEach(([key, value]) => {
        const error = validateField(key, value);
        if (error) {
          newErrors[key as keyof FormErrors] = error;
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const isFormValid = () => {
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    if (hasErrors) return false;

    // Check if all required fields are filled
    const { fullName, email, address, city, postalCode, country } = formData;
    const formFieldsValid = fullName && email && address && city && postalCode && country;

    if (paymentMethod === 'Card') {
      const { cardNumber, cardExpiry, cardCvc, cardName } = cardDetails;
      return formFieldsValid && cardName && cardNumber && cardExpiry && cardCvc;
    }

    return formFieldsValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allFields = [
      ...Object.keys(formData),
      ...(paymentMethod === 'Card' ? Object.keys(cardDetails) : [])
    ];
    const touchedFields = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(touchedFields);

    // Validate all fields
    if (!validateAllFields()) {
      toast.error('Please fix all validation errors before proceeding');
      return;
    }

    try {
      setProcessingOrder(true);
      
      // Create orders for all cart items
      for (const item of cartItems) {
        const orderData = {
          product: item.product.id,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          paymentMethod: paymentMethod,
          shippingAddress: formData
        };
        
        await createOrder(orderData);
      }

      // If using Card payment, process the payment
      if (paymentMethod === 'Card') {
        try {
          const paymentIntent = await createPaymentIntent(totalPrice);
          
          clearCart();
          toast.success('Payment successful!');
          
          navigate('/buyer/order-confirmation', { 
            state: { 
              success: true, 
              message: 'Your order has been placed and payment processed successfully!',
              paymentMethod: 'Card',
              shippingAddress: formData
            } 
          });
          return;
        } catch (error) {
          console.error('Payment processing failed:', error);
          toast.error('Failed to process payment. Please try again.');
          setProcessingOrder(false);
          return;
        }
      }
      
      // For Cash on Delivery
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/buyer/order-confirmation', { 
        state: { 
          success: true, 
          message: 'Your order has been placed successfully!',
          paymentMethod: 'CashOnDelivery',
          shippingAddress: formData
        } 
      });
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process your order. Please try again.');
      setProcessingOrder(false);
    }
  };

  const renderField = (
    name: string,
    label: string,
    type: string = 'text',
    placeholder?: string,
    value?: string,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    maxLength?: number
  ) => {
    const error = errors[name as keyof FormErrors];
    const isTouched = touched[name];
    
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} *
        </label>
        <input
          type={type}
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange || handleInputChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${
            isTouched && error ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          required
        />
        {isTouched && error && (
          <div className="flex items-center mt-1 text-red-500 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link to="/cart" className="flex items-center text-purple-600 hover:text-purple-800">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Shipping Information</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {renderField('fullName', 'Full Name', 'text', undefined, formData.fullName)}
                {renderField('email', 'Email', 'email', undefined, formData.email)}
              </div>
              
              <div className="mb-4">
                {renderField('address', 'Address', 'text', 'Enter your full address', formData.address)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {renderField('city', 'City', 'text', undefined, formData.city)}
                {renderField('postalCode', 'Postal Code', 'text', undefined, formData.postalCode)}
                {renderField('country', 'Country', 'text', undefined, formData.country)}
              </div>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-medium mb-4">Payment Method</h2>
            
            <div className="space-y-4">
              <div
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'CashOnDelivery' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('CashOnDelivery')}
              >
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full border flex items-center justify-center mr-3">
                    {paymentMethod === 'CashOnDelivery' && (
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="font-medium">Cash on Delivery</span>
                  </div>
                </div>
              </div>
              
              <div
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'Card' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('Card')}
              >
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full border flex items-center justify-center mr-3">
                    {paymentMethod === 'Card' && (
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="font-medium">Pay with Card</span>
                  </div>
                </div>
                
                {paymentMethod === 'Card' && (
                  <div className="mt-4 px-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Enter your card details below:
                    </p>
                    
                    <div className="space-y-4">
                      {renderField(
                        'cardName',
                        'Name on Card',
                        'text',
                        'John Smith',
                        cardDetails.cardName,
                        handleCardDetailsChange
                      )}
                      
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={(e) => {
                            const formattedValue = formatCardNumber(e.target.value);
                            setCardDetails(prev => ({ ...prev, cardNumber: formattedValue }));
                            
                            if (touched.cardNumber) {
                              const error = validateField('cardNumber', formattedValue);
                              setErrors(prev => ({ ...prev, cardNumber: error }));
                            }
                          }}
                          onBlur={handleBlur}
                          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${
                            touched.cardNumber && errors.cardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          required={paymentMethod === 'Card'}
                        />
                        {touched.cardNumber && errors.cardNumber && (
                          <div className="flex items-center mt-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardNumber}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            id="cardExpiry"
                            name="cardExpiry"
                            value={cardDetails.cardExpiry}
                            onChange={(e) => {
                              if (e.target.value.length <= 5) {
                                const formattedValue = formatExpiry(e.target.value);
                                setCardDetails(prev => ({ ...prev, cardExpiry: formattedValue }));
                                
                                if (touched.cardExpiry) {
                                  const error = validateField('cardExpiry', formattedValue);
                                  setErrors(prev => ({ ...prev, cardExpiry: error }));
                                }
                              }
                            }}
                            onBlur={handleBlur}
                            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${
                              touched.cardExpiry && errors.cardExpiry ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="MM/YY"
                            maxLength={5}
                            required={paymentMethod === 'Card'}
                          />
                          {touched.cardExpiry && errors.cardExpiry && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.cardExpiry}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
                            CVC *
                          </label>
                          <input
                            type="text"
                            id="cardCvc"
                            name="cardCvc"
                            value={cardDetails.cardCvc}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                setCardDetails(prev => ({ ...prev, cardCvc: value }));
                                
                                if (touched.cardCvc) {
                                  const error = validateField('cardCvc', value);
                                  setErrors(prev => ({ ...prev, cardCvc: error }));
                                }
                              }
                            }}
                            onBlur={handleBlur}
                            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${
                              touched.cardCvc && errors.cardCvc ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="123"
                            maxLength={4}
                            required={paymentMethod === 'Card'}
                          />
                          {touched.cardCvc && errors.cardCvc && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.cardCvc}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-medium mb-4">Order Summary</h2>
            
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div key={item.product.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-medium">${totalPrice.toFixed(2)}</p>
              </div>
              <div className="flex justify-between mb-2">
                <p className="text-gray-600">Shipping</p>
                <p className="font-medium">Free</p>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200">
                <p>Total</p>
                <p>${totalPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleSubmit(undefined as unknown as React.FormEvent<HTMLFormElement>)}
              disabled={!isFormValid() || processingOrder}
              className="w-full mt-6 bg-purple-600 text-white py-3 px-4 rounded-md flex items-center justify-center hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {processingOrder ? (
                <>
                  <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;