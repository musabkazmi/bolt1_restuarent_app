import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';
import { LogOut, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();

  const getRoleColor = (role: string) => {
    const colors = {
      manager: 'from-blue-500 to-blue-600',
      waiter: 'from-green-500 to-green-600',
      kitchen: 'from-orange-500 to-orange-600',
      customer: 'from-purple-500 to-purple-600'
    };
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleLogout = async () => {
    try {
      console.log('Logout button clicked');
      await signOut();
      console.log('Logout completed');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleNotificationClick = () => {
    console.log('Notification bell clicked');
    // Add notification functionality here
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-lg`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">RestaurantOS</h1>
            <span className="text-sm opacity-80 capitalize">• {user.role}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm opacity-90">
              Welcome, {user.name}
            </span>
            
            <button 
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg hover:bg-black/20 transition-colors"
            >
              <Bell className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white shadow-lg min-h-screen">
          <Navigation />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}