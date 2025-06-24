import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, ClipboardList, Users, BarChart3, Bot,
  ShoppingCart, Eye, FileText, ChefHat, Package,
  Menu, ShoppingBag
} from 'lucide-react';

const navigationItems = {
  manager: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/menu', icon: Menu, label: 'Menu' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/ai', icon: Bot, label: 'AI' },
  ],
  waiter: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/take-order', icon: ShoppingCart, label: 'Order' },
    { path: '/tables', icon: Eye, label: 'Tables' },
    { path: '/my-orders', icon: FileText, label: 'Orders' },
    { path: '/ai', icon: Bot, label: 'AI' },
  ],
  kitchen: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/pending-orders', icon: ClipboardList, label: 'Pending' },
    { path: '/completed', icon: ChefHat, label: 'Done' },
    { path: '/inventory', icon: Package, label: 'Stock' },
    { path: '/ai', icon: Bot, label: 'AI' },
  ],
  customer: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/menu', icon: Menu, label: 'Menu' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart' },
    { path: '/ai', icon: Bot, label: 'AI' },
  ],
};

export default function MobileNavigation() {
  const { user } = useAuth();
  
  if (!user) return null;

  const items = navigationItems[user.role] || [];

  const getRoleAccent = (role: string) => {
    const colors = {
      manager: 'text-blue-600',
      waiter: 'text-green-600',
      kitchen: 'text-orange-600',
      customer: 'text-purple-600'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
      <div className="flex justify-around">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? `${getRoleAccent(user.role)} font-medium`
                  : 'text-gray-400'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}