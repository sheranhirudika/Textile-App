import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import { CheckCircle, XCircle, Clock, Truck, CreditCard, RefreshCw, MapPin, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ApiOrder {
  _id: string;
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    imageUrl?: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  quantity: number;
  totalPrice: number;
  paymentMethod: 'CashOnDelivery' | 'Card';
  isPaid: boolean;
  status: string;
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

function AdminOrders() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      const orders: ApiOrder[] = response.map((order: any) => ({
        _id: order._id,
        product: order.product,
        user: order.user,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev =>
        prev.map(order => (order._id === orderId ? { ...order, status } : order))
      );
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(prev => (prev === orderId ? null : orderId));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadgeColor = (isPaid: boolean) =>
    isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const generatePdf = (order: ApiOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Order Summary", 14, 20);
    doc.setFontSize(12);
    doc.text(`Order ID: ${order._id}`, 14, 30);
    doc.text(`Status: ${order.status}`, 14, 38);
    doc.text(`Total Price: LKR ${order.totalPrice.toFixed(2)}`, 14, 46);
    autoTable(doc, {
      startY: 55,
      head: [["Field", "Value"]],
      body: [
        ["Customer Name", order.user.name],
        ["Email", order.user.email],
        ["Product", order.product.name],
        ["Quantity", order.quantity.toString()],
        ["Payment", order.paymentMethod + (order.isPaid ? " (Paid)" : " (Unpaid)")],
        ["Shipping Address", `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}`],
      ],
    });
    doc.save(`Order_${order._id}.pdf`);
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = filter === 'all' || order.status.toLowerCase() === filter.toLowerCase();
    const matchSearch = order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusOptions = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <div className="flex items-center gap-3">
          {/* \\Search and Filter */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer or product"
              className="pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
 <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders found {filter !== 'all' ? `with status "${filter}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <>
                    <tr
                      key={order._id}
                      onClick={() => toggleOrderDetails(order._id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={order.product.imageUrl || '/placeholder-product.png'}
                          alt={order.product.name}
                          className="h-10 w-10 object-cover rounded-md"
                        />
                        <div>
                          <div className="text-sm font-medium">{order.product.name}</div>
                          <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                          <div className="text-sm font-semibold text-purple-600">LKR {order.totalPrice.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`text-xs font-medium ${getPaymentBadgeColor(order.isPaid)} px-2 py-1 rounded-full`}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          {order.paymentMethod === 'Card' ? <><CreditCard className="h-3 w-3" /> Card</> : 'Cash On Delivery'}
                        </div>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, 'processing'); }}
                          disabled={order.status !== 'pending'}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-300">
                          <Clock className="h-5 w-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, 'shipped'); }}
                          disabled={order.status !== 'processing'}
                          className="text-purple-600 hover:text-purple-800 disabled:text-gray-300">
                          <Truck className="h-5 w-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, 'cancelled'); }}
                          disabled={!['pending', 'processing'].includes(order.status)}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-300">
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); generatePdf(order); }}
                          className="text-gray-700 hover:text-green-600">
                          <FileText className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>

                    {expandedOrder === order._id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-1 text-gray-900">Shipping Address</h4>
                              <p className="text-sm text-gray-600">{order.shippingAddress.fullName}</p>
                              <p className="text-sm text-gray-600">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                              <p className="text-sm text-gray-600">{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                              <p className="text-sm text-purple-600 mt-1">{order.shippingAddress.email}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1 text-gray-900">Order Info</h4>
                              <p className="text-sm text-gray-600">Order ID: {order._id}</p>
                              <p className="text-sm text-gray-600">Placed On: {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                              <p className="text-sm text-gray-600">Updated On: {format(new Date(order.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
