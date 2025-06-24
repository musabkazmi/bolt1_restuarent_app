import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, DollarSign, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { supabase, Order, OrderItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { menu_item: any })[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, selectedStatus]);

  const loadOrders = async () => {
    if (!user) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Loading orders for user:', user.id, 'role:', user.role);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          )
        `);

      // Apply role-based filtering
      switch (user.role) {
        case 'customer':
          query = query.eq('customer_id', user.id);
          break;
        case 'waiter':
          query = query.eq('waiter_id', user.id);
          break;
        case 'manager':
        case 'kitchen':
          // Show all orders for managers and kitchen staff
          break;
        default:
          query = query.eq('customer_id', user.id);
      }

      // Apply status filter if not 'all'
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        setError(`Failed to load orders: ${fetchError.message}`);
        return;
      }

      console.log('Orders loaded:', data?.length || 0, 'orders');
      setOrders(data || []);

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('An unexpected error occurred while loading orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log('Updating order status:', orderId, 'to', newStatus);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        setError('Failed to update order status');
        return;
      }

      // Reload orders to reflect the change
      await loadOrders();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const canUpdateStatus = (order: Order) => {
    switch (user?.role) {
      case 'manager':
        return true;
      case 'waiter':
        return order.waiter_id === user.id;
      case 'kitchen':
        return ['pending', 'preparing'].includes(order.status);
      default:
        return false;
    }
  };

  const getNextStatus = (currentStatus: string, userRole: string) => {
    const statusFlow = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'completed'
    };

    if (userRole === 'kitchen' && currentStatus === 'ready') {
      return null; // Kitchen can't mark as served
    }

    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Orders Loading Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={loadOrders}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'customer' ? 'My Orders' : 
             user?.role === 'waiter' ? 'My Assigned Orders' : 
             'All Orders'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'customer' ? 'Track your order history and status' :
             user?.role === 'waiter' ? 'Manage orders assigned to you' :
             'Monitor and manage all restaurant orders'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {orders.length} orders found
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Role: {user?.role}</p>
          <p>Orders Count: {orders.length}</p>
          <p>Selected Status: {selectedStatus}</p>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      {order.table_number ? (
                        <span className="text-blue-600 font-bold">T{order.table_number}</span>
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                        {order.table_number && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Table {order.table_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      ${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items:</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">
                              {item.quantity}x {item.menu_item?.name || 'Unknown Item'}
                            </span>
                            {item.notes && (
                              <p className="text-sm text-gray-600 italic">Note: {item.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-gray-900">
                              ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                            </span>
                            <span className={`block text-xs px-2 py-1 rounded mt-1 ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {canUpdateStatus(order) && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex gap-2">
                      {getNextStatus(order.status, user?.role || '') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status, user?.role || '') || '')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Mark as {getNextStatus(order.status, user?.role || '')?.replace('_', ' ')}
                        </button>
                      )}
                      
                      {user?.role === 'manager' && (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="served">Served</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              {selectedStatus !== 'all' 
                ? `No orders with status "${selectedStatus}" found`
                : user?.role === 'customer' 
                  ? "You haven't placed any orders yet"
                  : user?.role === 'waiter'
                    ? "No orders assigned to you"
                    : "No orders in the system"
              }
            </p>
            {selectedStatus !== 'all' && (
              <button
                onClick={() => setSelectedStatus('all')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show All Orders
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}