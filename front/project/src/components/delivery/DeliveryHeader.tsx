import { useAuth } from '../../context/AuthContext';

const DeliveryHeader = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900">Delivery Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs font-medium text-gray-500">Delivery Personnel</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DeliveryHeader;