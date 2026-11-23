'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
const AuthContext = createContext<{
  user: User | null;
  ready: boolean;
  signOut: () => Promise<void>;
}>({ user: null, ready: false, signOut: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase()
      .auth.getSession()
      .then(({ data }) => {
        setUser(data.session?.user || null);
        setReady(true);
      });
    const { data } = supabase().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        signOut: async () => {
          await supabase().auth.signOut();
          window.location.assign('/');
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
