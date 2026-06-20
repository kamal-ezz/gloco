import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  initialize: () => () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  initialize: () => {
    const timeoutId = setTimeout(() => {
      set({ loading: false });
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        set({ session: data.session, user: data.session?.user ?? null, error: null });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to fetch session';
        set({ session: null, user: null, error: message });
      })
      .finally(() => {
        clearTimeout(timeoutId);
        set({ loading: false });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      set({
        session: nextSession,
        user: nextSession?.user ?? null,
        loading: false
      });
    });

    return () => {
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }
}));
