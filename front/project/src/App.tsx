import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Components
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminDeliveries from './pages/admin/Deliveries';
import AdminRefunds from './pages/admin/Refunds';

// Buyer Components
import BuyerDashboard from './pages/buyer/Dashboard';
import ProductList from './pages/buyer/ProductList';
import ProductDetail from './pages/buyer/ProductDetail';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import BuyerOrders from './pages/buyer/Orders';

// Layout Components
import AdminLayout from './components/layouts/AdminLayout';
import BuyerLayout from './components/layouts/BuyerLayout';
import AuthLayout from './components/layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryLayout from './components/layouts/DeliveryLayout';
import UserProfilePage from './pages/buyer/UserProfilePage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/deliveries" element={<AdminDeliveries />} />
            <Route path="/admin/refunds" element={<AdminRefunds />} />
          </Route>

          {/* Buyer Routes */}
          <Route
            element={
              <ProtectedRoute role="buyer">
                <BuyerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            <Route path="/buyer/orders" element={<BuyerOrders />} />
            <Route path="/buyer/order-confirmation" element={<BuyerOrders />} />
          </Route>

          {/* Public Buyer Routes */}
          <Route element={<BuyerLayout />}>
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile/:id" element={<UserProfilePage />} />

          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* delivery */}
          <Route
            element={
              <ProtectedRoute role="delivery">
                <DeliveryLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
          </Route>


        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
