import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, XCircle, MapPin, Package, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { getMyDeliveries, updateDelivery, deleteDelivery } from '../../services/deliveryService';
import { Delivery } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText } from 'lucide-react';

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const generateReport = () => {
    try {
      // Create new PDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Delivery Report', 14, 22);

      // Add subtitle with date
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Define columns for the table
      const columns = [
        { title: 'Order #', dataKey: 'orderNumber' },
        { title: 'Customer', dataKey: 'customer' },
        { title: 'Status', dataKey: 'status' },
        { title: 'Amount', dataKey: 'amount' },
        { title: 'Delivery Date', dataKey: 'deliveryDate' },
        { title: 'Tracking #', dataKey: 'trackingNumber' }
      ];

      // Prepare data for the table
      const data = filteredDeliveries.map(delivery => ({
        orderNumber: delivery.order?._id.substring(0, 8).toUpperCase(),
        customer: typeof delivery.order?.user === 'object' && delivery.order?.user && 'name' in delivery.order.user 
          ? delivery.order.user.name 
          : 'N/A',
        status: delivery.deliveryStatus,
        amount: `LKR${delivery.order?.totalPrice?.toFixed(2) || '0.00'}`,
        deliveryDate: delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : 'N/A',
        trackingNumber: delivery.trackingNumber || 'N/A'
      }));

      // Add the table to the PDF using the correct autoTable import
      autoTable(doc, {
        head: [columns.map(col => col.title)],
        body: data.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
        startY: 40,
        styles: {
          cellPadding: 5,
          fontSize: 10,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Save the PDF
      doc.save(`delivery-report-${new Date().toISOString().slice(0, 10)}.pdf`);

      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const deliveries = await getMyDeliveries();
      setDeliveries(deliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, status: 'in-progress' | 'delivered' | 'failed') => {
    try {
      const apiStatus = status === 'in-progress' ? 'In Transit' :
        status === 'delivered' ? 'Delivered' : 'Failed';

      const updatedDelivery = await updateDelivery(deliveryId, { deliveryStatus: apiStatus });
      setDeliveries(deliveries.map(delivery =>
        delivery._id === deliveryId ? updatedDelivery : delivery
      ));
      toast.success(`Delivery status updated to ${apiStatus}`);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const handleGeneralUpdate = async (deliveryId: string, updateData: Partial<Delivery>) => {
    try {
      const updatedDelivery = await updateDelivery(deliveryId, updateData);
      setDeliveries(deliveries.map(delivery =>
        delivery._id === deliveryId ? updatedDelivery : delivery
      ));
      setEditingDelivery(null);
      toast.success('Delivery updated successfully');
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery');
    }
  };

  const handleDelete = async (deliveryId: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery?')) return;

    try {
      await deleteDelivery(deliveryId);
      setDeliveries(deliveries.filter(delivery => delivery._id !== deliveryId));
      toast.success('Delivery deleted successfully');
    } catch (error) {
      console.error('Error deleting delivery:', error);
      toast.error('Failed to delete delivery');
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const status = delivery.deliveryStatus.toLowerCase();
    if (activeTab === 'pending') return status === 'pending';
    if (activeTab === 'in-progress') return status === 'in transit';
    if (activeTab === 'completed') return ['delivered', 'failed'].includes(status);
    return true;
  });

  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>;
      case 'in transit':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">In Transit</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Delivered</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Failed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-orange-500" />
          My Deliveries
        </h1>

        <div className="flex gap-2">
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={fetchDeliveries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('in-progress')}
          className={`px-4 py-2 rounded-md ${activeTab === 'in-progress' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-md ${activeTab === 'completed' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
        >
          Completed
        </button>
      </div>

      {filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'pending'
              ? "You don't have any pending deliveries right now."
              : activeTab === 'in-progress'
                ? "You don't have any deliveries in progress."
                : "You haven't completed any deliveries yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{delivery.order?._id?.substring(0, 8).toUpperCase() || 'N/A'}
                        </h3>
                        {getStatusBadge(delivery.deliveryStatus)}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingDelivery(delivery)}
                            className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                            title="Edit delivery"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(delivery._id)}
                            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                            title="Delete delivery"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {delivery.order?.shippingAddress
                              ? `${delivery.order.shippingAddress.address || ''}, ${delivery.order.shippingAddress.city || ''}, ${delivery.order.shippingAddress.postalCode || ''}, ${delivery.order.shippingAddress.country || ''}`
                              : 'No address provided'}
                          </p>
                        </div>

                        <div className="mt-2">
                                  
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Email:</span> {delivery.order?.shippingAddress?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          LKR{delivery.order?.totalPrice?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </p>
                        {delivery.trackingNumber && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Tracking:</span> {delivery.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {editingDelivery?._id === delivery._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Edit Delivery</h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleGeneralUpdate(delivery._id, {
                        deliveryStatus: formData.get('status') as string,
                        trackingNumber: formData.get('trackingNumber') as string,
                        deliveryDate: formData.get('deliveryDate') as string
                      });
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            defaultValue={delivery.deliveryStatus}
                            className="w-full border rounded-md p-2 text-sm"
                            required
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                          <input
                            type="text"
                            name="trackingNumber"
                            defaultValue={delivery.trackingNumber}
                            className="w-full border rounded-md p-2 text-sm"
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                          <input
                            type="datetime-local"
                            name="deliveryDate"
                            defaultValue={delivery.deliveryDate?.substring(0, 16)}
                            className="w-full border rounded-md p-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingDelivery(null)}
                          className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Pending tab: Only display info message for non-admin users, no action buttons */}
                {activeTab === 'pending' && !isAdmin && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Waiting for admin to assign this delivery. You'll be able to start once it's in progress.
                    </p>
                  </div>
                )}

                {/* Only show Start Delivery button for admins on pending deliveries */}
                {activeTab === 'pending' && isAdmin && delivery.deliveryStatus === 'Pending' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleStatusUpdate(delivery._id, 'in-progress')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Start Delivery
                    </button>
                  </div>
                )}

                {/* In Transit tab: Allow delivery persons to mark as delivered/failed */}
                {delivery.deliveryStatus === 'In Transit' && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => handleStatusUpdate(delivery._id, 'delivered')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(delivery._id, 'failed')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Report Issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;