import { useState, useEffect } from 'react';
import { getMyOrders, cancelOrder } from '../../services/orderService';
import { Package, XCircle, Truck, CheckCircle, Clock, AlertCircle, MapPin, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';



type Order = {
  _id: string;
  product: {
    imageUrl: string;
    name: string;
    description: string;
  };
  quantity: number;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email: string;
    fullName?: string;
  };
  paymentMethod: string;
  isPaid: boolean;
  paidAt?: string;
  updatedAt?: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  refundStatus?: string | null;
  refundRequested?: boolean;
};

type Refund = {
  _id: string;
  order: string | { _id: string };
  status: string;
};

function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundReason, setRefundReason] = useState('');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrdersAndRefunds();
  }, []);

  const fetchOrdersAndRefunds = async () => {
    try {
      setLoading(true);
      
      const [ordersData, refundsData] = await Promise.all([
        getMyOrders(),
        fetchRefunds()
      ]);
      
      const ordersWithRefundStatus = ordersData.map(order => {
        const refundRequest = refundsData.find((refund: Refund) => 
          (refund.order && typeof refund.order === 'object' && refund.order._id === order._id) || 
          (refund.order && typeof refund.order === 'string' && refund.order === order._id)
        );

        const safeProduct = {
          ...order.product,
          imageUrl: order.product.imageUrl ?? ''
        };

        const safeShippingAddress = {
          fullName: order.shippingAddress?.fullName ?? '',
          address: order.shippingAddress?.address ?? '',
          city: order.shippingAddress?.city ?? '',
          postalCode: order.shippingAddress?.postalCode ?? '',
          country: order.shippingAddress?.country ?? '',
          email: order.shippingAddress?.email ?? ''
        };

        return {
          ...order,
          product: safeProduct,
          shippingAddress: safeShippingAddress,
          refundStatus: refundRequest ? refundRequest.status : null,
          refundRequested: Boolean(refundRequest)
        };
      });

      setOrders(ordersWithRefundStatus);
      setRefunds(refundsData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/refunds/get', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching refunds:', error);
      return [];
    }
  };

  const getRefundStatus = (orderId: string) => {
    const refund = refunds.find(refund => {
      if (refund.order && typeof refund.order === 'object') {
        return refund.order._id === orderId;
      } else {
        return refund.order === orderId;
      }
    });
    
    return refund ? refund.status : null;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
        setOrders(prev => prev.map(order =>
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        toast.success('Order cancelled successfully');
      } catch {
        toast.error('Failed to cancel the order');
      }
    }
  };

  const openRefundModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const closeRefundModal = () => {
    setIsRefundModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }
      
      await axios.post(
        'http://localhost:5000/api/refunds/', 
        {
          orderId: selectedOrderId,
          reason: refundReason
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Refund request submitted successfully');
      closeRefundModal();
      
      setOrders(prev => prev.map(order => 
        order._id === selectedOrderId 
          ? { ...order, refundRequested: true, refundStatus: 'Requested' } 
          : order
      ));
      
      const newRefunds = await fetchRefunds();
      setRefunds(newRefunds);
      
    } catch (error) {
      console.error('Refund request error:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as unknown) === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: unknown }).response !== null &&
        (error as { response?: { data?: unknown } }).response &&
        (error as { response?: { data?: unknown } }).response &&
        'data' in (error as { response: { data?: unknown } }).response &&
        typeof ((error as { response: { data?: unknown } }).response.data) === 'object' &&
        ((error as { response: { data?: unknown } }).response.data) !== null &&
        ((error as { response?: { data?: { message?: string } } }).response?.data !== undefined &&
        'message' in (error as { response: { data: { message?: string } } }).response.data)
      ) {
        toast.error(
          ((error as { response: { data: { message?: string } } }).response.data.message) ||
          'Failed to submit refund request'
        );
      } else {
        toast.error('Failed to submit refund request');
      }
    }
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

  const getRefundStatusDetails = (status: string | undefined | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'Requested':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <RefreshCw className="h-4 w-4" />,
          text: 'Refund Requested'
        };
      case 'Approved':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Refund Approved'
        };
      case 'Rejected':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4" />,
          text: 'Refund Rejected'
        };
      default:
        return null;
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };



// Update your generateOrderReport function with this version
const generateOrderReport = (order: Order) => {
  try {
    // Initialize jsPDF
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Order Report - #${order._id.slice(-6).toUpperCase()}`, 14, 20);
    
    // Add order details
    doc.setFontSize(12);
    doc.text(`Order Date: ${formatDate(order.createdAt)}`, 14, 30);
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 14, 36);
    if (order.refundStatus) {
      doc.text(`Refund Status: ${order.refundStatus}`, 14, 42);
    }
    
    // Add product details
    doc.setFontSize(14);
    doc.text('Product Details', 14, 52);
    
    const productData = [
      ['Name', order.product.name],
      ['Description', order.product.description],
      ['Quantity', order.quantity.toString()],
      ['Unit Price', formatCurrency(order.totalPrice / order.quantity)],
      ['Total Price', formatCurrency(order.totalPrice)]
    ];
    
    // First table
    autoTable(doc, {
      startY: 58,
      head: [['Field', 'Value']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 10 }
    } as UserOptions);
    
    // Add shipping details
    doc.setFontSize(14);
    doc.text('Shipping Information', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const shippingData = [
      ['Full Name', order.shippingAddress.fullName],
      ['Address', order.shippingAddress.address],
      ['City', order.shippingAddress.city],
      ['Postal Code', order.shippingAddress.postalCode],
      ['Country', order.shippingAddress.country],
      ['Email', order.shippingAddress.email]
    ];
    
    // Second table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: shippingData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 10 }
    } as UserOptions);
    
    // Add payment details
    doc.setFontSize(14);
    doc.text('Payment Information', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const paymentData = [
      ['Payment Method', order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)],
      ['Payment Status', order.isPaid ? 'Paid' : 'Pending'],
      ['Paid At', order.isPaid ? formatDate(order.paidAt || order.updatedAt || order.createdAt) : 'N/A'],
      ['Total Amount', formatCurrency(order.totalPrice)]
    ];
    
    // Third table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 10 }
    } as UserOptions);
    
    // Save the PDF
    doc.save(`order_report_${order._id.slice(-6).toUpperCase()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate report');
  }
};

  const renderRefundMessage = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md text-sm text-green-700">
            <p className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Your refund request has been approved
            </p>
          </div>
        );
      case 'Rejected':
        return (
          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md text-sm text-red-700">
            <p className="flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              Your refund request has been rejected
            </p>
          </div>
        );
      case 'Requested':
        return (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
            <p className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              Your refund request is being processed
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const shouldShowRefundButton = (order: Order) => {
    if (!order.isPaid || order.status === 'cancelled') return false;
    
    const refundRequest = refunds.find(refund => {
      if (refund.order && typeof refund.order === 'object') {
        return refund.order._id === order._id;
      } else {
        return refund.order === order._id;
      }
    });
    
    return !refundRequest || refundRequest.status === 'Rejected';
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
        <div className="text-sm text-gray-500">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-600 mb-4">No orders found</p>
          <p className="text-gray-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusDetails = getStatusDetails(order.status);
            const refundStatus = getRefundStatus(order._id);
            const refundStatusDetails = getRefundStatusDetails(refundStatus);

            return (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</h2>
                      <p className="text-sm text-gray-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusDetails.color} flex items-center gap-1`}>
                        {statusDetails.icon}
                        {statusDetails.text}
                      </span>
                      {refundStatusDetails && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${refundStatusDetails.color} flex items-center gap-1`}>
                          {refundStatusDetails.icon}
                          {refundStatusDetails.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <img
                          src={order.product.imageUrl}
                          alt={order.product.name}
                          className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{order.product.name}</h3>
                          <p className="text-sm text-gray-500">{order.product.description}</p>
                          <p className="text-sm text-gray-500 mt-1">Quantity: {order.quantity}</p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-start">
                          <div className="p-2 rounded-full bg-gray-100 text-gray-600 mr-3">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Shipping Address</h4>
                            <div className="text-sm text-gray-600">
                              <p>{order.shippingAddress.fullName}</p>
                              <p>{order.shippingAddress.address}</p>
                              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                              <p>{order.shippingAddress.country}</p>
                              <p className="mt-1 text-purple-600">{order.shippingAddress.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 md:w-48">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment Method</p>
                          <p className="text-sm text-gray-500 capitalize">{order.paymentMethod.toLowerCase()}</p>
                          <p className={`text-sm ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                            {order.isPaid ? `Paid on ${formatDate(order.paidAt ?? order.updatedAt ?? order.createdAt)}` : 'Payment Pending'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Amount</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {formatCurrency(order.totalPrice)}
                          </p>
                        </div>

                        {refundStatus && renderRefundMessage(refundStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => generateOrderReport(order)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Report
                    </button>

                    {(order.status === 'pending' || order.status === 'processing') && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel Order
                      </button>
                    )}
                    
                    {shouldShowRefundButton(order) && (
                      <button
                        onClick={() => openRefundModal(order._id)}
                        className="flex items-center text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Request Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund Request Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Request a Refund</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for refund
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
                placeholder="Please provide details about why you're requesting a refund..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeRefundModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerOrders;