import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MenuPage from './components/MenuPage';
import OrdersPage from './components/OrdersPage';
import AIAgent from './components/AIAgent';
import AddMenuItem from './components/AddMenuItem';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading RestaurantOS</h2>
          <p className="text-gray-600">Setting up your restaurant management system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/add-menu-item" element={<AddMenuItem />} />
        <Route path="/staff" element={<div className="p-8 text-center text-gray-500">Staff overview coming soon...</div>} />
        <Route path="/reports" element={<div className="p-8 text-center text-gray-500">Sales reports coming soon...</div>} />
        <Route path="/take-order" element={<div className="p-8 text-center text-gray-500">Take order page coming soon...</div>} />
        <Route path="/tables" element={<div className="p-8 text-center text-gray-500">Table view coming soon...</div>} />
        <Route path="/my-orders" element={<OrdersPage />} />
        <Route path="/pending-orders" element={<OrdersPage />} />
        <Route path="/completed" element={<div className="p-8 text-center text-gray-500">Completed dishes coming soon...</div>} />
        <Route path="/inventory" element={<div className="p-8 text-center text-gray-500">Inventory view coming soon...</div>} />
        <Route path="/cart" element={<div className="p-8 text-center text-gray-500">Cart/checkout coming soon...</div>} />
        <Route path="/ai" element={<AIAgent />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;