import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'supervisor' | 'author' | 'moderator' | 'user';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const checkRoles = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      const userRoles = (data?.map(r => r.role) || []) as AppRole[];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin'));
      setIsSupervisor(userRoles.includes('supervisor') || userRoles.includes('admin'));
      setIsAuthor(userRoles.includes('author') || userRoles.includes('admin'));
    } catch {
      setIsAdmin(false);
      setIsSupervisor(false);
      setIsAuthor(false);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          checkRoles(session.user.id);
        } else {
          setIsAdmin(false);
          setIsSupervisor(false);
          setIsAuthor(false);
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkRoles(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkRoles]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return { error: result.error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: result.error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setIsSupervisor(false);
    setIsAuthor(false);
    setRoles([]);
  }, []);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return { session, user, loading, isAdmin, isSupervisor, isAuthor, roles, hasRole, signIn, signUp, signOut };
}
