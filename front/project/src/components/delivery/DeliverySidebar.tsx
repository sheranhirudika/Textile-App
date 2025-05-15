/* eslint-disable @typescript-eslint/no-unused-vars */
import { Truck, Package, User, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DeliverySidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Delivery Panel</h1>
      </div>
      
      <nav className="p-4 space-y-1">
        <NavLink
          to="/delivery/dashboard"
          className={({ isActive }) => 
            `flex items-center px-4 py-2 rounded-lg ${isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`
          }
        >
          <Truck className="w-5 h-5 mr-3" />
          My Deliveries
        </NavLink>
        
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </nav>
    </div>
  );
};

export default DeliverySidebar;