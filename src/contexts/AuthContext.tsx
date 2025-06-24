import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import type { AuthError, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not found. Running in demo mode.');
          setLoading(false);
          return;
        }

        console.log('Initializing auth...');

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.email);

        if (mounted) {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event, session?.user?.email);
          
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } else if (data) {
        console.log('User profile found:', data);
        setUser(data);
      } else {
        console.warn('No user profile found for user ID:', userId);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      console.log('Attempting to sign up user:', email, 'with role:', role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      if (data.user) {
        console.log('User created, now creating profile...');
        
        // Wait a moment for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name,
              role,
            },
          ])
          .select()
          .single();

        console.log('Profile creation response:', { profileData, profileError });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError as AuthError };
        }

        // If email confirmation is disabled, the user should be signed in immediately
        if (data.session) {
          console.log('User signed in immediately');
          setUser(profileData);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      return { error };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('Successfully signed out');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}