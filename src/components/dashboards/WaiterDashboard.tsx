import React from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { mockOrders, mockTables } from '../../data/mockData';

export default function WaiterDashboard() {
  const myOrders = mockOrders.filter(order => order.waiterId === '2');
  const activeTables = mockTables.filter(table => table.status === 'occupied');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Waiter Dashboard</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
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
          <div className="space-y-4">
            {myOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                    <span className="text-green-600 font-bold">T{order.tableNumber}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{order.customerName}</h4>
                    <p className="text-sm text-gray-500">{order.items.length} items • ${order.total}</p>
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
                    {new Date(order.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}