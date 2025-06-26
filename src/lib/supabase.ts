import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key';

// Create a mock client for demo mode
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Demo mode: Supabase not configured' } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Demo mode: Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Demo mode: Supabase not configured' } }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  })
});

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient() as any;

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

// Export whether we're in demo mode
export const isDemoMode = !hasValidCredentials;