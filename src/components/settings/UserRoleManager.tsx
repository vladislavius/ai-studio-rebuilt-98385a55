import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type AppRole = 'admin' | 'supervisor' | 'author' | 'moderator' | 'user';

const ROLE_CONFIG: Record<AppRole, { label: string; dot: string; chip: string }> = {
  admin:      { label: 'Админ',        dot: 'bg-primary',     chip: 'bg-primary/10 text-primary border-primary/20' },
  supervisor: { label: 'Супервайзер',  dot: 'bg-blue-500',    chip: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  author:     { label: 'Автор',        dot: 'bg-violet-500',  chip: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' },
  moderator:  { label: 'Модератор',    dot: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  user:       { label: 'Пользователь', dot: 'bg-muted-foreground', chip: 'bg-muted text-muted-foreground border-border' },
};

const ALL_ROLES: AppRole[] = ['admin', 'supervisor', 'author', 'moderator', 'user'];

export function UserRoleManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success(`Роль «${ROLE_CONFIG[role].label}» назначена`);
      setAddingFor(null);
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success(`Роль «${ROLE_CONFIG[role].label}» снята`);
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  });

  const handleRemove = (userId: string, role: AppRole) => {
    if (userId === user?.id && role === 'admin') {
      toast.error('Нельзя снять роль администратора с себя');
      return;
    }
    removeRole.mutate({ userId, role });
  };

  if (loadingProfiles || loadingRoles) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="animate-spin" size={14} />
        Загрузка пользователей...
      </div>
    );
  }

  if (!profiles?.length) {
    return <p className="text-sm text-muted-foreground py-4">Нет пользователей в системе</p>;
  }

  return (
    <div className="space-y-2">
      {profiles.map(p => {
        const roles = (userRoles?.filter(r => r.user_id === p.user_id) ?? []).map(r => r.role as AppRole);
        const available = ALL_ROLES.filter(r => !roles.includes(r));
        const isMe = p.user_id === user?.id;
        const isOpen = addingFor === p.user_id;

        return (
          <div key={p.id} className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-display font-bold text-primary">
                {(p.display_name ?? p.email ?? '?').slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-foreground text-sm truncate">
                {p.display_name ?? p.email ?? '—'}
                {isMe && <span className="text-primary text-[10px] ml-2 font-body">(вы)</span>}
              </p>
              <p className="text-xs text-muted-foreground font-body truncate">{p.email}</p>
            </div>

            {/* Role chips + add button */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-xs">
              {roles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-display font-bold ${ROLE_CONFIG[role].chip}`}
                >
                  {ROLE_CONFIG[role].label}
                  <button
                    onClick={() => handleRemove(p.user_id, role)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    aria-label={`Снять роль ${ROLE_CONFIG[role].label}`}
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}

              {available.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setAddingFor(isOpen ? null : p.user_id)}
                    className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors font-display font-bold"
                    aria-label="Добавить роль"
                  >
                    <Plus size={10} />
                    Роль
                  </button>

                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAddingFor(null)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[140px] overflow-hidden py-1">
                        {available.map(role => (
                          <button
                            key={role}
                            onClick={() => addRole.mutate({ userId: p.user_id, role })}
                            className="w-full text-left px-3 py-1.5 text-xs font-display font-semibold hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${ROLE_CONFIG[role].dot}`} />
                            {ROLE_CONFIG[role].label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
