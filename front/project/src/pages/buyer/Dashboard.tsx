import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, RotateCcw, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { getMyOrders } from '../../services/orderService';
import { Order } from '../../types';
import toast from 'react-hot-toast';

function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-LK', options);
  };

  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending'
        };
      case 'processing':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <Truck className="h-4 w-4" />,
          text: 'Processing'
        };
      case 'shipped':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: <Truck className="h-4 w-4" />,
          text: 'Shipped'
        };
      case 'delivered':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Delivered'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="h-4 w-4" />,
          text: status
        };
    }
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(order => order.status.toLowerCase() === 'pending').length,
    deliveredOrders: orders.filter(order => order.status.toLowerCase() === 'delivered').length,
    cancelledOrders: orders.filter(order => order.status.toLowerCase() === 'cancelled').length,
    // totalSpent: orders.reduce((sum, order) => sum + (order.isPaid ? order.totalPrice : 0), 0),
    totalSpent: orders.reduce((sum, order) => sum + order.totalPrice, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-50">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">LKR{stats.totalSpent.toFixed(2)}</p>
            </div>
            <RotateCcw className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <Link
              to="/buyer/orders"
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
            >
              View All Orders
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {orders.slice(0, 5).map((order) => {
            const statusDetails = getStatusDetails(order.status);
            
            return (
              <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <img
                    src={order.product.imageUrl}
                    alt={order.product.name}
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{order.product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Ordered on {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0 text-right">
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(order.totalPrice)}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                            {statusDetails.icon}
                            <span className="ml-1">{statusDetails.text}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="p-6 text-center">
              <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">You haven't placed any orders yet</p>
              <Link
                to="/products"
                className="inline-block mt-4 text-purple-600 hover:text-purple-800 font-medium"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;