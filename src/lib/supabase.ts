import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  role: 'manager' | 'waiter' | 'kitchen' | 'customer';
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  waiter_id?: string;
  table_number?: number;
  customer_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
  menu_item?: MenuItem;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  type: 'user' | 'assistant';
  created_at: string;
}