"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import {User, Session} from '@supabase/supabase-js';
import {createClient} from '@/lib/supabase/client';
import type {
  AppRole,
  OnboardingMetadata,
  AuthContextType
} from '@/types/auth';

const supabase = createClient();

function clearAuthStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  sessionStorage.removeItem('bookingRedirect');
  sessionStorage.removeItem('authRedirectTo');
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      setUserRoles([]);
      return [] as AppRole[];
    }

    const roles = (data ?? []).map((r) => r.role as AppRole);
    setUserRoles(roles);
    return roles;
  };

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Explicit sign-out or token refresh failure — clear everything
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setUser(null);
        setSession(null);
        setUserRoles([]);
        clearAuthStorage();
        setLoading(false);
        return;
      }

      // Token refreshes (e.g. on tab focus) — update session silently, skip re-renders
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        return;
      }

      setSession(session);

      // Preserve the same user object reference if the user hasn't changed
      // This prevents useEffect([user]) from re-firing across the app
      const newUserId = session?.user?.id ?? null;
      setUser(prev => {
        const prevUserId = prev?.id ?? null;
        if (prevUserId === newUserId && prevUserId !== null) return prev;
        return session?.user ?? null;
      });

      if (session?.user) {
        // Only trigger loading + role fetch for actual user changes (sign-in),
        // not repeat events for the same user (e.g. INITIAL_SESSION on tab focus)
        setUserRoles(prev => {
          if (prev.length > 0) {
            // Already have roles for this user — skip refetch
            setLoading(false);
            return prev;
          }
          setLoading(true);
          setTimeout(() => {
            fetchUserRoles(session.user.id).finally(() => setLoading(false));
          }, 0);
          return prev;
        });
      } else {
        setUserRoles([]);
        setLoading(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // If there's a refresh token error, clear the stale session
      if (error) {
        console.error('Session error:', error);
        clearAuthStorage();
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setSession(null);
        setUserRoles([]);
        setLoading(false);
        return;
      }

      // Session exists but token is expired and couldn't be refreshed
      if (session?.expires_at && session.expires_at * 1000 < Date.now() && !session.access_token) {
        console.warn('Session expired, clearing auth state');
        clearAuthStorage();
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setSession(null);
        setUserRoles([]);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        fetchUserRoles(session.user.id).finally(() => setLoading(false));
      } else {
        setUserRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    userTypes: AppRole[],
    onboardingData?: OnboardingMetadata
  ) => {
    const redirectUrl = `${window.location.origin}/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          user_types: userTypes,
          onboarding: onboardingData || {},
        },
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    // Store intended destination for after auth callback
    if (redirectTo && redirectTo !== '/dashboard') {
      sessionStorage.setItem('authRedirectTo', redirectTo);
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        shouldCreateUser: false,
      },
    });

    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      // Always clear state and storage, even if signOut API fails
      setUser(null);
      setSession(null);
      setUserRoles([]);
      clearAuthStorage();
    }
  };

  const hasRole = (role: AppRole) => userRoles.includes(role);
  
  const hasAnyRole = (roles: AppRole[]) => roles.some(role => userRoles.includes(role));

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRoles,
      loading,
      signUp,
      signIn,
      signInWithMagicLink,
      signOut,
      hasRole,
      hasAnyRole,
      updatePassword
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
