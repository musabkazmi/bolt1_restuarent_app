import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase, Order, OrderItem } from '../../lib/supabase';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<(Order & { order_items: (OrderItem & { menu_item: any })[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
      } else {
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const updateOrderItemStatus = async (itemId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating order item status:', error);
      } else {
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating order item status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'preparing');
  const completedToday = 18; // This would come from a real query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
        <div className="text-sm text-gray-500">
          {pendingOrders.length} orders in queue
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Prep Time</p>
              <p className="text-2xl font-bold text-gray-900">18m</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ChefHat className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Queue */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Order Queue</h3>
        </div>
        <div className="p-6">
          {pendingOrders.length > 0 ? (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                        <span className="text-orange-600 font-bold text-sm">
                          T{order.table_number || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-gray-500">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'NEW' : 'PREPARING'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">
                            {item.quantity}x {item.menu_item?.name || 'Unknown Item'}
                          </span>
                          {item.notes && (
                            <p className="text-sm text-gray-600 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.status}
                          </span>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateOrderItemStatus(item.id, 'preparing')}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Start
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderItemStatus(item.id, 'ready')}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Ready
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No pending orders at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}