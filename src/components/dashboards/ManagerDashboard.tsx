import React from 'react';
import { 
  TrendingUp, Users, ClipboardList, DollarSign, 
  Clock, CheckCircle, AlertTriangle, BarChart3 
} from 'lucide-react';
import { mockOrders } from '../../data/mockData';

export default function ManagerDashboard() {
  const totalRevenue = 2450.50;
  const todayOrders = mockOrders.length;
  const activeStaff = 8;
  const avgOrderTime = 22;

  const recentActivity = [
    { id: '1', action: 'New order received', time: '2 minutes ago', type: 'order' },
    { id: '2', action: 'Staff member clocked in', time: '15 minutes ago', type: 'staff' },
    { id: '3', action: 'Order completed', time: '20 minutes ago', type: 'complete' },
    { id: '4', action: 'Inventory low alert', time: '1 hour ago', type: 'alert' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12.5%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">{todayOrders}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Peak: 12-2 PM</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{activeStaff}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">3 Kitchen • 5 Service</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgOrderTime}m</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">On target</span>
          </div>
        </div>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {[65, 45, 80, 55, 90, 75, 85].map((height, index) => (
              <div key={index} className="flex-1 bg-blue-100 rounded-t relative">
                <div 
                  className="bg-blue-500 rounded-t w-full transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'order' ? 'bg-blue-50' :
                  activity.type === 'staff' ? 'bg-green-50' :
                  activity.type === 'complete' ? 'bg-purple-50' : 'bg-red-50'
                }`}>
                  {activity.type === 'order' && <ClipboardList className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'staff' && <Users className="w-4 h-4 text-green-600" />}
                  {activity.type === 'complete' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}