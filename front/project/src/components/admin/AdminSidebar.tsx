import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  RotateCcw,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: <Package size={20} />,
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: <ShoppingCart size={20} />,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: <Users size={20} />,
    },
    {
      name: 'Deliveries',
      path: '/admin/deliveries',
      icon: <Truck size={20} />,
    },
    {
      name: 'Refunds',
      path: '/admin/refunds',
      icon: <RotateCcw size={20} />,
    },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white h-screen overflow-y-auto sticky top-0">
      <div className="p-4 border-b border-purple-700">
        <Link to="/admin/dashboard" className="flex items-center justify-center">
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      
      <nav className="mt-5">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-6 py-3 ${
                  isActive(item.path)
                    ? 'bg-purple-700 border-l-4 border-amber-400 font-medium'
                    : 'hover:bg-purple-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full">
        <button
          onClick={logout}
          className="flex items-center px-6 py-3 w-full hover:bg-purple-700 text-left"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;