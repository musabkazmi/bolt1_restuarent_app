import React, { useState, useEffect } from 'react';
import { Star, Heart, ShoppingCart, Clock, Utensils, AlertCircle } from 'lucide-react';
import { supabase, MenuItem, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerDashboard() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    // Only load data if user exists
    if (user) {
      loadData();
    } else {
      // If no user, don't load data and stop loading
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading data for user:', user);
      setError(''); // Clear any previous errors
      
      // Load menu items with better error handling
      console.log('Fetching menu items...');
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .limit(6); // Show more items on dashboard

      if (menuError) {
        console.error('Error loading menu items:', menuError);
        setError(`Failed to load menu items: ${menuError.message}`);
      } else {
        console.log('Menu items loaded:', menuData?.length || 0, 'items');
        setMenuItems(menuData || []);
      }

      // Load recent orders
      console.log('Fetching recent orders...');
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        // Don't set error for orders as it's not critical for the dashboard
      } else {
        console.log('Orders loaded:', ordersData?.length || 0, 'orders');
        setRecentOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: MenuItem) => {
    if (!user) {
      setError('Please sign in to add items to cart');
      return;
    }

    try {
      console.log('Adding item to cart:', item);
      
      // Add to local cart state immediately for better UX
      setCartItems(prev => [...prev, item]);
      
      // Create a new order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            customer_name: user.name || 'Customer',
            status: 'pending',
            total: item.price,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        setError('Failed to create order');
        // Remove from cart if order creation failed
        setCartItems(prev => prev.filter(cartItem => cartItem.id !== item.id));
        return;
      }

      console.log('Order created:', orderData);

      // Add order item
      const { error: orderItemError } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: orderData.id,
            menu_item_id: item.id,
            quantity: 1,
            price: item.price,
          },
        ]);

      if (orderItemError) {
        console.error('Error creating order item:', orderItemError);
        setError('Failed to add item to order');
        return;
      }

      console.log('Order item created successfully');
      
      // Refresh orders
      await loadData();
      
      // Clear any previous errors
      setError('');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
      // Remove from cart if there was an error
      setCartItems(prev => prev.filter(cartItem => cartItem.id !== item.id));
    }
  };

  // Don't show loading if user is not logged in
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back, {user?.name}!</h1>
          <p className="text-gray-600">Discover delicious meals crafted with care</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => console.log('Cart clicked, items:', cartItems)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({cartItems.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={() => {
              setError('');
              loadData();
            }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Role: {user?.role}</p>
          <p>Menu Items: {menuItems.length}</p>
          <p>Recent Orders: {recentOrders.length}</p>
          <p>Cart Items: {cartItems.length}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Today's Special</h2>
          <p className="text-purple-100 mb-4">
            Fresh Atlantic Salmon with seasonal vegetables and lemon butter sauce
          </p>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">$24.99</span>
            <button 
              onClick={() => {
                const specialItem = menuItems.find(item => item.name.toLowerCase().includes('salmon'));
                if (specialItem) {
                  addToCart(specialItem);
                } else {
                  console.log('Special item not found in menu');
                }
              }}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => console.log('Browse Menu clicked')}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-purple-50 rounded-lg w-fit mx-auto mb-3">
            <Utensils className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900">Browse Menu</h3>
          <p className="text-sm text-gray-500">View all dishes</p>
        </button>

        <button 
          onClick={() => console.log('Quick Order clicked')}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-green-50 rounded-lg w-fit mx-auto mb-3">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900">Quick Order</h3>
          <p className="text-sm text-gray-500">Reorder favorites</p>
        </button>

        <button 
          onClick={() => console.log('Reviews clicked')}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-3">
            <Star className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">Reviews</h3>
          <p className="text-sm text-gray-500">Rate your meals</p>
        </button>

        <button 
          onClick={() => console.log('Favorites clicked')}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-red-50 rounded-lg w-fit mx-auto mb-3">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="font-medium text-gray-900">Favorites</h3>
          <p className="text-sm text-gray-500">Saved items</p>
        </button>
      </div>

      {/* Featured Items */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Featured Items</h3>
            <button 
              onClick={() => console.log('View all menu clicked')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View All Menu →
            </button>
          </div>
        </div>
        <div className="p-6">
          {menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="group cursor-pointer border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-32 mb-4 flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Utensils className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.available}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        item.available
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {item.available ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No menu items available at the moment.</p>
              <button 
                onClick={loadData}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Refresh Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="p-6">
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-500">
                      {order.status} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${order.total}</p>
                    <button 
                      onClick={() => console.log('Reorder clicked for order:', order.id)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No orders yet. Start by browsing our menu!</p>
          )}
        </div>
      </div>
    </div>
  );
}