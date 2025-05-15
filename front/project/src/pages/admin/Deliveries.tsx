import { useState, useEffect } from 'react';
import { Truck, MapPin, User, Clock, RefreshCw, Edit, Search, FileText, Filter, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeliveries, updateDeliveryPerson } from '../../services/deliveryService';

interface Delivery {
  _id: string;
  order: {
    _id: string;
    product: string | { _id: string; name: string; };
    user: string | { _id: string; name: string; };
    quantity: number;
    totalPrice: number;
    paymentMethod: string;
    isPaid: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
  };
  deliveryPerson: string;
  deliveryStatus: string;
  deliveryDate?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    applyFilters();
  }, [deliveries, searchTerm, statusFilter, dateSort]);

  const applyFilters = () => {
    let results = [...deliveries];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (delivery) =>
          delivery._id.toLowerCase().includes(term) ||
          delivery.deliveryPerson.toLowerCase().includes(term) ||
          delivery.deliveryStatus.toLowerCase().includes(term) ||
          delivery.trackingNumber?.toLowerCase().includes(term) ||
          (typeof delivery.order.product === 'object' ? 
            delivery.order.product.name.toLowerCase().includes(term) : 
            delivery.order.product.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      results = results.filter((delivery) => delivery.deliveryStatus === statusFilter);
    }

    // Apply date sort
    results = results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredDeliveries(results);
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await getDeliveries();
      // Extract data correctly from the API response
      if (response && Array.isArray(response)) {
        setDeliveries(response);
        setFilteredDeliveries(response);
        console.log('Deliveries loaded:', response);
      } else {
        console.error('Unexpected API response format:', response);
        toast.error('Invalid data format received');
        setDeliveries([]);
        setFilteredDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
      setDeliveries([]);
      setFilteredDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleEditDeliveryPerson = (deliveryId: string, currentPerson: string) => {
    setEditingDeliveryId(deliveryId);
    setDeliveryPersonName(currentPerson);
  };

  const handleCancelEdit = () => {
    setEditingDeliveryId(null);
    setDeliveryPersonName('');
  };
//Delivery person update
  const handleUpdateDeliveryPerson = async (deliveryId: string) => {
    if (!deliveryPersonName.trim()) {
      toast.error('Delivery person name cannot be empty');
      return;
    }

    try {
      await updateDeliveryPerson(deliveryId, deliveryPersonName);
      setDeliveries(deliveries.map(delivery => 
        delivery._id === deliveryId ? { ...delivery, deliveryPerson: deliveryPersonName } : delivery
      ));
      toast.success('Delivery person updated successfully');
      setEditingDeliveryId(null);
      setDeliveryPersonName('');
    } catch (error) {
      console.error('Error updating delivery person:', error);
      toast.error('Failed to update delivery person');
    }
  };

  const getStatusColor = (status: string) => {
    // Convert to lowercase for consistent comparison
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'pending') {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    } else if (normalizedStatus === 'in transit' || normalizedStatus === 'in-transit' || normalizedStatus === 'in progress') {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    } else if (normalizedStatus === 'delivered') {
      return 'bg-green-50 text-green-700 border border-green-200';
    } else if (normalizedStatus === 'failed') {
      return 'bg-red-50 text-red-700 border border-red-200';
    } else {
      return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'pending') {
      return <Clock className="h-4 w-4" />;
    } else if (normalizedStatus === 'in transit' || normalizedStatus === 'in-transit' || normalizedStatus === 'in progress') {
      return <Truck className="h-4 w-4" />;
    } else if (normalizedStatus === 'delivered') {
      return <CheckCircle className="h-4 w-4" />;
    } else if (normalizedStatus === 'failed') {
      return <XCircle className="h-4 w-4" />;
    } else {
      return null;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const exportToPDF = () => {
    try {
      // Get current date for the report
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Calculate total amount
      const totalAmount = filteredDeliveries.reduce((sum, delivery) => {
        return sum + delivery.order.totalPrice;
      }, 0);

      // Create a new window/tab for the PDF
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      // Get unique statuses for statistics
      const statusStats = deliveries.reduce((acc, delivery) => {
        const status = delivery.deliveryStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Create the HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Deliveries Report</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
                size: A4 landscape;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            
            .header {
              background: #9333ea;
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 20px;
            }
            
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            
            .header h2 {
              margin: 10px 0 0 0;
              font-size: 16px;
              font-weight: normal;
            }
            
            .report-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              margin-bottom: 20px;
            }
            
            .stat-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #9333ea;
            }
            
            .stat-label {
              color: #6b7280;
              font-size: 14px;
              margin-top: 5px;
            }
            
            .filter-info {
              background: #f3f4f6;
              padding: 10px 15px;
              border-radius: 6px;
              margin-bottom: 20px;
              font-size: 14px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              font-size: 12px;
            }
            
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            
            th {
              background: #9333ea;
              color: white;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            
            tr:nth-child(even) {
              background: #f9fafb;
            }
            
            tr:hover {
              background: #f3f4f6;
            }
            
            .status-badge {
              padding: 4px 8px;
              border-radius: 20px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .status-pending {
              background: #fef3c7;
              color: #d97706;
            }
            
            .status-in-transit, .status-in-progress {
              background: #dbeafe;
              color: #1d4ed8;
            }
            
            .status-delivered {
              background: #dcfce7;
              color: #15803d;
            }
            
            .status-failed {
              background: #fef2f2;
              color: #b91c1c;
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            
            .no-print {
              display: none;
            }
            
            @media screen {
              .no-print {
                display: block;
                text-align: center;
                margin-bottom: 20px;
              }
              
              button {
                background: #9333ea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
              }
              
              button:hover {
                background: #7c3aed;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Print PDF</button>
            <button onclick="window.close()">Close</button>
          </div>
          
          <div class="header">
            <h1>TextileShop</h1>
            <h2>Deliveries Management Report</h2>
          </div>
          
          <div class="report-info">
            <div>
              <strong>Generated on:</strong> ${currentDate}<br>
              <strong>Total Deliveries:</strong> ${filteredDeliveries.length}${statusFilter !== 'All' ? ` (${statusFilter})` : ''}
            </div>
            <div>
              <strong>Total Amount:</strong> LKR ${totalAmount.toFixed(2)}<br>
              <strong>Search:</strong> ${searchTerm || 'All Records'}
            </div>
          </div>
          
          <div class="stats">
            ${Object.entries(statusStats).map(([status, count]) => `
              <div class="stat-card">
                <div class="stat-value">${count}</div>
                <div class="stat-label">${status}</div>
              </div>
            `).join('')}
            <div class="stat-card">
              <div class="stat-value">LKR ${totalAmount.toFixed(2)}</div>
              <div class="stat-label">Total Amount</div>
            </div>
          </div>
          
          ${statusFilter !== 'All' || searchTerm ? `
          <div class="filter-info">
            <strong>Active Filters:</strong>
            ${statusFilter !== 'All' ? `Status: ${statusFilter}` : ''}
            ${searchTerm ? `Search: "${searchTerm}"` : ''}
          </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Tracking Number</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Delivery Person</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDeliveries.map((delivery) => `
                <tr>
                  <td style="font-weight: bold;">#${delivery._id.slice(-8).toUpperCase()}</td>
                  <td>${delivery.trackingNumber || 'N/A'}</td>
                  <td>${typeof delivery.order.product === 'object' 
                    ? delivery.order.product.name 
                    : delivery.order.product}</td>
                  <td>${delivery.order.quantity}</td>
                  <td style="font-weight: bold;">LKR ${delivery.order.totalPrice.toFixed(2)}</td>
                  <td>${delivery.deliveryPerson || 'Not assigned'}</td>
                  <td>
                    <span class="status-badge status-${delivery.deliveryStatus.toLowerCase().replace(' ', '-')}">
                      ${delivery.deliveryStatus}
                    </span>
                  </td>
                  <td>${delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}</td>
                  <td>${new Date(delivery.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} TextileShop - Deliveries Management System</p>
            <p>This report contains ${filteredDeliveries.length} delivery records generated on ${currentDate}</p>
          </div>
        </body>
        </html>
      `;

      // Write the HTML content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Focus on the new window and print
      printWindow.focus();
      
      toast.success('PDF report opened in new window. You can now print or save as PDF.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deliveries Management</h1>
              <p className="text-gray-600 mt-1">Manage and track delivery operations</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search box */}
              <div className="relative min-w-0 flex-grow lg:flex-grow-0 lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Filter by status */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-40"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              
              {/* Sort by date */}
              <button
                onClick={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 transition-transform ${dateSort === 'asc' ? 'rotate-180' : ''}`} />
                {dateSort === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
              
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {/* Export to PDF */}
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {deliveries.filter(d => d.deliveryStatus.toLowerCase() === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deliveries.filter(d => d.deliveryStatus.toLowerCase().includes('transit') || d.deliveryStatus.toLowerCase().includes('progress')).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveries.filter(d => d.deliveryStatus.toLowerCase() === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search results info */}
        {(searchTerm || statusFilter !== 'All') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing {filteredDeliveries.length} results</span>
              {searchTerm && <span> for "{searchTerm}"</span>}
              {statusFilter !== 'All' && <span> with status "{statusFilter}"</span>}
            </p>
          </div>
        )}

        {/* Deliveries Grid */}
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500">There are currently no deliveries to display</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Truck className="h-6 w-6 text-purple-600 mr-2" />
                      <span className="text-lg font-bold text-gray-900">#{delivery._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.deliveryStatus)}`}>
                      {getStatusIcon(delivery.deliveryStatus)}
                      <span className="ml-1">{delivery.deliveryStatus}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Tracking Number */}
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-white px-3 py-2 rounded border">
                        {delivery.trackingNumber || 'N/A'}
                      </p>
                    </div>

                    {/* Delivery Person */}
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Delivery Person</p>
                      </div>
                      
                      {editingDeliveryId === delivery._id ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input 
                            type="text" 
                            value={deliveryPersonName}
                            onChange={(e) => setDeliveryPersonName(e.target.value)}
                            className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Enter delivery person name"
                          />
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleUpdateDeliveryPerson(delivery._id)}
                              className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              title="Save"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600">{delivery.deliveryPerson || 'Not assigned'}</p>
                          <button 
                            onClick={() => handleEditDeliveryPerson(delivery._id, delivery.deliveryPerson)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                            title="Edit delivery person"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Order Details</p>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          Product: {typeof delivery.order.product === 'string' 
                            ? delivery.order.product 
                            : delivery.order.product.name}
                        </p>
                        <p className="text-sm text-gray-600">Quantity: {delivery.order.quantity}</p>
                        <p className="text-sm font-semibold text-purple-600">
                          LKR {delivery.order.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Delivery Date: {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty search results */}
            {filteredDeliveries.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Truck className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'All' 
                      ? "No deliveries match your search criteria" 
                      : "There are no deliveries at the moment"}
                  </p>
                  {(searchTerm || statusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDeliveries;