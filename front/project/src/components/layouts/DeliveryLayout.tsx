import { Outlet } from 'react-router-dom';
import DeliverySidebar from '../delivery/DeliverySidebar';
import DeliveryHeader from '../delivery/DeliveryHeader';

const DeliveryLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <DeliverySidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DeliveryHeader />
        
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DeliveryLayout;