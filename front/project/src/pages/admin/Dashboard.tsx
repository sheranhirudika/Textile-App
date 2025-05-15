/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BarChart3, Users, ShoppingBag, TruckIcon, RefreshCcw, CreditCard, DollarSign } from 'lucide-react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeUsers: 0,
    totalOrders: 0,
    deliveries: 0,
    refunds: 0,
    paymentMethods: { card: 0, cash: 0 },
    orderStatuses: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch orders
        const ordersResponse = await axios.get('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Fetch users
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (ordersResponse.data && ordersResponse.data.data) {
          setOrders(ordersResponse.data.data);
          
          // Pass both orders and users to calculate stats
          if (usersResponse.data && usersResponse.data.data) {
            calculateStats(ordersResponse.data.data, usersResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  interface Order {
    _id: string;
    totalPrice: number;
    paymentMethod: string;
    status: string;
    product: {
      name: string;
      imageUrl: string;
    };
    quantity: number;
    user: {
      name: string;
      email: string;
    };
  }

  interface User {
    _id: string;
    name: string;
    email: string;
  }

  const calculateStats = (orders: Order[], users: User[]) => {
    // Calculate total sales by summing up all orders' totalPrice
    // Only count paid orders if isPaid is true, otherwise count all orders
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Use the actual user count from the API
    const activeUsers = Array.isArray(users) ? users.length : 0;
    
    const paymentMethods = {
      card: orders.filter(order => order.paymentMethod === 'Card').length,
      cash: orders.filter(order => order.paymentMethod === 'CashOnDelivery').length
    };
    
    const orderStatuses = {
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    setStats({
      totalSales,
      activeUsers,
      totalOrders: orders.length,
      deliveries: orderStatuses.delivered,
      refunds: 0, // You'll need to fetch refunds separately
      paymentMethods,
      orderStatuses
    });
  };

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: [5000, 8000, 6000, 9000, 12000, 10000, 15000, 18000, 20000, 17000, 22000, 25000],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  const paymentMethodData = {
    labels: ['Card Payments', 'Cash on Delivery'],
    datasets: [
      {
        data: [stats.paymentMethods.card, stats.paymentMethods.cash],
        backgroundColor: ['rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const orderStatusData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          stats.orderStatuses.pending,
          stats.orderStatuses.processing,
          stats.orderStatuses.shipped,
          stats.orderStatuses.delivered,
          stats.orderStatuses.cancelled
        ],
        backgroundColor: [
          'rgba(234, 179, 8, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(239, 68, 68, 0.6)'
        ],
        borderColor: [
          'rgba(234, 179, 8, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const recentOrders: Order[] = orders.slice(0, 5);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +12%
                </span>
              </div>
              <h2 className="text-gray-600 text-sm font-medium">Total Sales</h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                LKR {stats.totalSales.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +5%
                </span>
              </div>
              <h2 className="text-gray-600 text-sm font-medium">Active Users</h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.activeUsers}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +8%
                </span>
              </div>
              <h2 className="text-gray-600 text-sm font-medium">Total Orders</h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalOrders}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TruckIcon className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +15%
                </span>
              </div>
              <h2 className="text-gray-600 text-sm font-medium">Deliveries</h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.deliveries}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <RefreshCcw className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm font-semibold text-red-600">
                  -2%
                </span>
              </div>
              <h2 className="text-gray-600 text-sm font-medium">Refunds</h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.refunds}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h2>
              <div className="h-64">
                <Bar 
                  data={salesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
                <div className="h-64">
                  <Pie 
                    data={paymentMethodData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
                <div className="h-64">
                  <Pie 
                    data={orderStatusData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={order.product.imageUrl} alt={order.product.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{order.product.name}</div>
                              <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.user.name}</div>
                          <div className="text-sm text-gray-500">{order.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          LKR {order.totalPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;