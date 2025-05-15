import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download } from 'lucide-react';
import { Product } from '../../types';
import { getProducts, deleteProduct } from '../../services/productService';
import { AddProductModal, EditProductModal, DeleteConfirmationModal } from './ProductModals';
import toast from 'react-hot-toast';

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (productId: string): Promise<void> => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleProductAdded = () => {
    fetchProducts(); // Refresh the product list
  };

  const handleProductUpdated = () => {
    fetchProducts(); // Refresh the product list
  };

  const generatePDF = () => {
    try {
      // Get current date for the report
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Category statistics
      const categoryCount = filteredProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate total inventory value
      const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);

      // Low stock products (less than 20)
      const lowStockProducts = filteredProducts.filter(product => product.stock < 20);

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
          <title>Products Management Report</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
                size: A4;
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
            
            .low-stock {
              color: #dc2626;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            
            th {
              background: #9333ea;
              color: white;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.05em;
            }
            
            tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .category-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              background: #e7e5e4;
              color: #44403c;
            }
            
            .price {
              font-weight: bold;
              color: #059669;
            }
            
            .stock {
              font-weight: bold;
            }
            
            .stock.low {
              color: #dc2626;
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
            <h2>Products Inventory Report</h2>
          </div>
          
          <div class="report-info">
            <div>
              <strong>Generated on:</strong> ${currentDate}<br>
              <strong>Total Products:</strong> ${filteredProducts.length}
            </div>
            <div>
              <strong>Report Type:</strong> Product Inventory<br>
              <strong>Status:</strong> Current Stock Data
            </div>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${filteredProducts.length}</div>
              <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">LKR${totalValue.toFixed(2)}</div>
              <div class="stat-label">Total Inventory Value</div>
            </div>
            <div class="stat-card ${lowStockProducts.length > 0 ? 'low-stock' : ''}">
              <div class="stat-value">${lowStockProducts.length}</div>
              <div class="stat-label">Low Stock Alert</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Object.keys(categoryCount).length}</div>
              <div class="stat-label">Product Categories</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map((product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${product.name}</strong></td>
                  <td>
                    <span class="category-badge">
                      ${product.category}
                    </span>
                  </td>
                  <td class="price">LKR${product.price.toFixed(2)}</td>
                  <td class="stock ${product.stock < 10 ? 'low' : ''}">
                    ${product.stock}
                    ${product.stock < 11 ? ' ⚠️' : ''}
                  </td>
                  <td class="price">LKR${(product.price * product.stock).toFixed(2)}</td>
                  <td>${product.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: bold;">
                <td colspan="5">Total Inventory Value:</td>
                <td class="price">LKR${totalValue.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          ${lowStockProducts.length > 0 ? `
            <div style="margin-top: 30px;">
              <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">⚠️ Low Stock Alert</h3>
              <p style="color: #6b7280; margin-bottom: 15px;">The following products have stock levels below 10 units:</p>
              <ul style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                ${lowStockProducts.map(product => `
                  <li style="margin-bottom: 5px;">
                    <strong>${product.name}</strong> - Only ${product.stock} left in stock
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} TextileShop - Product Management System</p>
            <p>This report contains ${filteredProducts.length} product records as of ${currentDate}</p>
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <div className="flex gap-4">
          <button
            onClick={generatePDF}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>
      
{/* serch bar  */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  LKR{product.price.toFixed(2)}
                </td>
                {/* low stock alert  */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={product.stock < 20 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                    {product.stock}
                    {product.stock < 20 && ' ⚠️'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowEditModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        productId={productToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default AdminProducts;