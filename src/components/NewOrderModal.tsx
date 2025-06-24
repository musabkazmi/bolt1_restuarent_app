import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, User, MapPin, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, MenuItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function NewOrderModal({ isOpen, onClose, onOrderPlaced }: NewOrderModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadMenuItems();
      // Reset form when modal opens
      setOrderItems([]);
      setCustomerName('');
      setTableNumber('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const loadMenuItems = async () => {
    try {
      setLoadingMenu(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error loading menu items:', fetchError);
        setError('Failed to load menu items');
        return;
      }

      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setError('Failed to load menu items');
    } finally {
      setLoadingMenu(false);
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { menuItem, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const groupItemsByCategory = () => {
    const grouped: { [key: string]: MenuItem[] } = {};
    menuItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const placeOrder = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Validation
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!tableNumber.trim()) {
      setError('Please enter table number');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      setError('Please enter a valid table number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const total = calculateTotal();

      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            waiter_id: user.id,
            customer_id: null, // Waiter-created orders don't have a customer_id
            table_number: tableNum,
            customer_name: customerName.trim(),
            status: 'pending',
            total: total,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        setError(`Failed to create order: ${orderError.message}`);
        return;
      }

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        setError(`Failed to add items to order: ${itemsError.message}`);
        return;
      }

      setSuccess(`Order placed successfully! Order #${orderData.id.slice(0, 8)}`);
      
      // Reset form
      setOrderItems([]);
      setCustomerName('');
      setTableNumber('');

      // Close modal and refresh orders after a short delay
      setTimeout(() => {
        onOrderPlaced();
        onClose();
        setSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error placing order:', error);
      setError('An unexpected error occurred while placing the order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const groupedItems = groupItemsByCategory();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">New Order</h2>
                <p className="opacity-90">Create a new order for your table</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Menu Items Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Menu Items</h3>
            
            {loadingMenu ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <span className="text-lg font-bold text-green-600">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                          <button
                            onClick={() => addToOrder(item)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Order
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="w-96 bg-gray-50 p-6 border-l border-gray-200 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            {/* Customer Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Table Number *
                </label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto mb-6">
              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.menuItem.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-medium text-gray-900 text-sm">{item.menuItem.name}</h6>
                        <span className="text-sm font-bold text-gray-900">
                          ${(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">
                          ${item.menuItem.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No items added yet</p>
                  <p className="text-gray-400 text-xs">Select items from the menu</p>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={placeOrder}
                disabled={loading || orderItems.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Place Order (${calculateTotal().toFixed(2)})
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}