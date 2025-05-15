import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Trash2, Search, FileText, Filter, RefreshCw, Edit, X, Package, User, MapPin, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}

interface Order {
  _id: string;
  product: string; // This is just the product ID
  quantity: number;
  totalPrice: number;
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
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface RefundWithProduct extends Omit<Refund, 'order'> {
  order: Order | null;
  productDetails?: Product | null;
}

interface Refund {
  _id: string;
  order: Order | null;
  user: User;
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected';
  createdAt: string;
  notes?: string;
}

function AdminRefunds() {
  const [refunds, setRefunds] = useState<RefundWithProduct[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<RefundWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundWithProduct | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    reason: '',
    notes: ''
  });
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [refunds, searchTerm, statusFilter, dateSort]);

  const applyFilters = () => {
    let results = [...refunds];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (refund) =>
          refund._id.toLowerCase().includes(term) ||
          refund.user.name.toLowerCase().includes(term) ||
          refund.user.email.toLowerCase().includes(term) ||
          refund.reason.toLowerCase().includes(term) ||
          (refund.productDetails?.name?.toLowerCase().includes(term) || false)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      results = results.filter((refund) => refund.status === statusFilter);
    }

    // Apply date sort
    results = results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredRefunds(results);
  };

  const fetchProductDetails = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/refunds/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.data) {
        // Handle refunds with and without order data
        const refundsWithProducts = await Promise.all(
          response.data.data.map(async (refund: Refund) => {
            // If order is null, return the refund as is with added productDetails: null
            if (!refund.order) {
              return {
                ...refund,
                productDetails: null
              };
            }
            
            // If we have an order, get product details
            const productDetails = await fetchProductDetails(refund.order.product);
            return {
              ...refund,
              productDetails
            };
          })
        );
        
        setRefunds(refundsWithProducts);
        setFilteredRefunds(refundsWithProducts);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setError('Failed to load refunds. Please try again.');
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (refund: RefundWithProduct) => {
    setSelectedRefund(refund);
    setUpdateFormData({
      status: refund.status,
      reason: refund.reason,
      notes: refund.notes || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateRefund = async () => {
    if (!selectedRefund) return;

    try {
      const token = localStorage.getItem('token');
      
      // Prepare data for update
      const updateData = {
        status: updateFormData.status,
        reason: updateFormData.reason,
        notes: updateFormData.notes
      };

      await axios.put(
        `http://localhost:5000/api/refunds/${selectedRefund._id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update both refunds arrays
      const updatedRefunds = refunds.map(refund =>
        refund._id === selectedRefund._id 
          ? { 
              ...refund, 
              status: updateFormData.status as 'Requested' | 'Approved' | 'Rejected',
              reason: updateFormData.reason,
              notes: updateFormData.notes 
            } 
          : refund
      );
      
      setRefunds(updatedRefunds);
      // filteredRefunds will be updated automatically via useEffect
      
      toast.success('Refund updated successfully');
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating refund:', error);
      toast.error('Failed to update refund');
    }
  };

  const handleRefundAction = async (refundId: string, action: 'Approved' | 'Rejected') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/refunds/${refundId}`,
        { status: action },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update both refunds arrays
      const updatedRefunds = refunds.map(refund =>
        refund._id === refundId ? { ...refund, status: action } : refund
      );
      
      setRefunds(updatedRefunds);
      // filteredRefunds will be updated automatically via useEffect
      
      toast.success(`Refund ${action.toLowerCase()} successfully`);
    } catch (error) {
      console.error(`Error ${action} refund:`, error);
      toast.error(`Failed to ${action.toLowerCase()} refund`);
    }
  };

  const handleDeleteRefund = async (refundId: string) => {
    if (window.confirm('Are you sure you want to delete this refund request?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/refunds/${refundId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Update both refunds arrays
        const updatedRefunds = refunds.filter(refund => refund._id !== refundId);
        setRefunds(updatedRefunds);
        // filteredRefunds will be updated automatically via useEffect
        
        toast.success('Refund request deleted successfully');
      } catch (error) {
        console.error('Error deleting refund:', error);
        toast.error('Failed to delete refund request');
      }
    }
  };

  const exportToPDF = () => {
    try {
      // Get current date for the report
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Calculate total refund amounts
      const totalAmount = filteredRefunds.reduce((sum, refund) => {
        return sum + (refund.order ? refund.order.totalPrice : 0);
      }, 0);

      // Create a new window/tab for the PDF
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      // Create the HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Refunds Report</title>
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
            
            .status-requested {
              background: #fef3c7;
              color: #d97706;
            }
            
            .status-approved {
              background: #dcfce7;
              color: #15803d;
            }
            
            .status-rejected {
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
            <h2>Refunds Management Report</h2>
          </div>
          
          <div class="report-info">
            <div>
              <strong>Generated on:</strong> ${currentDate}<br>
              <strong>Total Refunds:</strong> ${filteredRefunds.length}${statusFilter !== 'All' ? ` (${statusFilter})` : ''}
            </div>
            <div>
              <strong>Total Amount:</strong> LKR ${totalAmount.toFixed(2)}<br>
              <strong>Search:</strong> ${searchTerm || 'All Records'}
            </div>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${refunds.filter(r => r.status === 'Requested').length}</div>
              <div class="stat-label">Pending Requests</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${refunds.filter(r => r.status === 'Approved').length}</div>
              <div class="stat-label">Approved Refunds</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${refunds.filter(r => r.status === 'Rejected').length}</div>
              <div class="stat-label">Rejected Requests</div>
            </div>
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
                <th>Refund ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Order ID</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRefunds.map((refund) => `
                <tr>
                  <td style="font-weight: bold;">#${refund._id.slice(-6).toUpperCase()}</td>
                  <td>${refund.user.name}</td>
                  <td>${refund.user.email}</td>
                  <td>${refund.order ? '#' + refund.order._id.slice(-6).toUpperCase() : 'N/A'}</td>
                  <td>${refund.productDetails 
                    ? refund.productDetails.name 
                    : (refund.order ? `Product ID: ${refund.order.product.slice(-6)}` : 'N/A')}</td>
                  <td style="font-weight: bold;">${refund.order ? 'LKR ' + refund.order.totalPrice.toFixed(2) : 'N/A'}</td>
                  <td>
                    <span class="status-badge status-${refund.status.toLowerCase()}">
                      ${refund.status}
                    </span>
                  </td>
                  <td>${new Date(refund.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</td>
                  <td>${refund.reason.length > 50 ? refund.reason.substring(0, 50) + '...' : refund.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} TextileShop - Refunds Management System</p>
            <p>This report contains ${filteredRefunds.length} refund records generated on ${currentDate}</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Requested':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Approved':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Requested':
        return <Clock className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading refunds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">Error Loading Refunds</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchRefunds}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" ref={pdfRef}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Refunds Management</h1>
              <p className="text-gray-600 mt-1">Manage and process customer refund requests</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search box */}
              <div className="relative min-w-0 flex-grow lg:flex-grow-0 lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search refunds..."
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
                  <option value="Requested">Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
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
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900">{refunds.length}</p>
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
                  {refunds.filter(r => r.status === 'Requested').length}
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
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {refunds.filter(r => r.status === 'Approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {refunds.filter(r => r.status === 'Rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search results info */}
        {(searchTerm || statusFilter !== 'All') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing {filteredRefunds.length} results</span>
              {searchTerm && <span> for "{searchTerm}"</span>}
              {statusFilter !== 'All' && <span> with status "{statusFilter}"</span>}
            </p>
          </div>
        )}

        {/* Refunds grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRefunds.map((refund) => (
            <div key={refund._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      #{refund._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(refund.status)}`}>
                      {getStatusIcon(refund.status)}
                      <span className="ml-1">{refund.status}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRefund(refund._id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Delete refund request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Order Details */}
                  {refund.order ? (
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Order Details</p>
                      </div>
                      <div className="mt-3 flex items-center">
                        <img
                          src={refund.productDetails?.imageUrl || 'https://via.placeholder.com/150'}
                          alt={refund.productDetails?.name || 'Product image'}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {refund.productDetails?.name || `Product ID: ${refund.order.product}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {refund.order.quantity}
                          </p>
                          <p className="text-sm font-semibold text-purple-600 mt-1">
                            LKR {refund.order.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Order Details</p>
                      </div>
                      <p className="text-sm text-gray-500 italic mt-2">No order information available</p>
                    </div>
                  )}

                  {/* Customer Details */}
                  <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Customer</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">{refund.user.name}</p>
                      <p className="text-sm text-gray-500">{refund.user.email}</p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {refund.order?.shippingAddress && (
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">{refund.order.shippingAddress.fullName}</p>
                        <p>{refund.order.shippingAddress.address}</p>
                        <p>{refund.order.shippingAddress.city}, {refund.order.shippingAddress.postalCode}</p>
                        <p>{refund.order.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Refund Details */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Reason for Refund</p>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border break-words overflow-wrap-anywhere">
                        {refund.reason}
                      </div>
                    </div>

                    {refund.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Internal Notes</p>
                        <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200 break-words overflow-wrap-anywhere">
                          {refund.notes}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(refund.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  {refund.status === 'Requested' && (
                    <>
                      <button
                        onClick={() => handleRefundAction(refund._id, 'Approved')}
                        className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center font-medium text-sm shadow-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRefundAction(refund._id, 'Rejected')}
                        className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center font-medium text-sm shadow-sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleUpdateClick(refund)}
                    className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center font-medium text-sm shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredRefunds.length === 0 && !loading && (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No refund requests found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'All' 
                    ? "No refund requests match your search criteria" 
                    : "There are no refund requests at the moment"}
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
      </div>

      {/* Modal update block below */}
      {showUpdateModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Refund</h2>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={updateFormData.status}
                  onChange={handleUpdateFormChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none transition-all ${updateFormData.status ? 'border-gray-300' : 'border-red-500'}`}
                >
                  <option value="">-- Select Status --</option>
                  <option value="Requested">Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                {!updateFormData.status && (
                  <p className="text-xs text-red-500 mt-1">Status is required.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  name="reason"
                  value={updateFormData.reason}
                  onChange={handleUpdateFormChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none transition-all resize-none ${updateFormData.reason ? 'border-gray-300' : 'border-red-500'}`}
                  rows={3}
                />
                {!updateFormData.reason && (
                  <p className="text-xs text-red-500 mt-1">Reason is required.</p>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                >Cancel</button>
                <button
                  onClick={handleUpdateRefund}
                  disabled={!updateFormData.status || !updateFormData.reason}
                  className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors ${(!updateFormData.status || !updateFormData.reason) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRefunds;
