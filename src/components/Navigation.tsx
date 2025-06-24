import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, ClipboardList, Users, BarChart3, Bot,
  ShoppingCart, Eye, FileText, ChefHat, Package,
  Menu, ShoppingBag, User
} from 'lucide-react';

const navigationItems = {
  manager: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/orders', icon: ClipboardList, label: 'Orders Overview' },
    { path: '/menu', icon: Menu, label: 'Menu Management' },
    { path: '/staff', icon: Users, label: 'Staff Overview' },
    { path: '/reports', icon: BarChart3, label: 'Sales Reports' },
    { path: '/ai', icon: Bot, label: 'AI Agent' },
  ],
  waiter: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/take-order', icon: ShoppingCart, label: 'Take Order' },
    { path: '/tables', icon: Eye, label: 'Table View' },
    { path: '/my-orders', icon: FileText, label: 'My Orders' },
    { path: '/ai', icon: Bot, label: 'AI Agent' },
  ],
  kitchen: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/pending-orders', icon: ClipboardList, label: 'Pending Orders' },
    { path: '/completed', icon: ChefHat, label: 'Completed Dishes' },
    { path: '/inventory', icon: Package, label: 'Inventory View' },
    { path: '/ai', icon: Bot, label: 'AI Agent' },
  ],
  customer: [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/menu', icon: Menu, label: 'Browse Menu' },
    { path: '/orders', icon: ShoppingBag, label: 'My Orders' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart/Checkout' },
    { path: '/ai', icon: Bot, label: 'AI Agent' },
  ],
};

export default function Navigation() {
  const { user } = useAuth();
  
  if (!user) return null;

  const items = navigationItems[user.role] || [];

  const getRoleAccent = (role: string) => {
    const colors = {
      manager: 'text-blue-600 bg-blue-50 border-blue-200',
      waiter: 'text-green-600 bg-green-50 border-green-200',
      kitchen: 'text-orange-600 bg-orange-50 border-orange-200',
      customer: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <nav className="p-4">
      <div className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? `${getRoleAccent(user.role)} font-medium`
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}