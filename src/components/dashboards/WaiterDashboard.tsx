import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { supabase, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import NewOrderModal from '../NewOrderModal';

export default function WaiterDashboard() {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only load data if user exists and is a waiter
    if (user && user.role === 'waiter') {
      loadMyOrders();
    } else if (user) {
      // If user exists but not waiter, stop loading
      setLoading(false);
    }
  }, [user]);

  const loadMyOrders = async () => {
    if (!user || user.role !== 'waiter') {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('waiter_id', user.id)
        .in('status', ['pending', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading waiter orders:', error);
      } else {
        setMyOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading waiter orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Reload orders
      await loadMyOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleNewOrderPlaced = () => {
    // Refresh orders when a new order is placed
    loadMyOrders();
  };

  // Mock table data - in a real app, this would come from a tables table
  const mockTables = [
    { id: '1', number: 1, seats: 2, status: 'available' },
    { id: '2', number: 2, seats: 4, status: 'available' },
    { id: '3', number: 3, seats: 4, status: 'occupied' },
    { id: '4', number: 4, seats: 6, status: 'available' },
    { id: '5', number: 5, seats: 2, status: 'occupied' },
    { id: '6', number: 6, seats: 4, status: 'reserved' },
    { id: '7', number: 7, seats: 6, status: 'occupied' },
    { id: '8', number: 8, seats: 8, status: 'available' }
  ];

  const activeTables = mockTables.filter(table => table.status === 'occupied');

  // Don't show loading if user is not logged in or not a waiter
  if (!user || user.role !== 'waiter') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Waiter Dashboard</h1>
        <button 
          onClick={() => setShowNewOrderModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{myOrders.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tables Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{activeTables.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Completed</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">My Active Orders</h3>
        </div>
        <div className="p-6">
          {myOrders.length > 0 ? (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <span className="text-green-600 font-bold">
                        {order.table_number ? `T${order.table_number}` : '#'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{order.customer_name}</h4>
                      <p className="text-sm text-gray-500">
                        Order #{order.id.slice(0, 8)} • ${order.total}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active orders assigned to you.</p>
          )}
        </div>
      </div>

      {/* Table Status */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Table Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mockTables.map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 text-center cursor-pointer transition-all hover:scale-105 ${
                  table.status === 'available' ? 'border-green-200 bg-green-50' :
                  table.status === 'occupied' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="text-lg font-bold text-gray-900">T{table.number}</div>
                <div className="text-xs text-gray-600">{table.seats} seats</div>
                <div className={`text-xs font-medium mt-1 ${
                  table.status === 'available' ? 'text-green-600' :
                  table.status === 'occupied' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {table.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onOrderPlaced={handleNewOrderPlaced}
      />
    </div>
  );
}