import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Company Settings ───
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
  });
}

export function useUpdateCompanySetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('company_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Сохранено');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Department CRUD ───
export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('departments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Департамент обновлён');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dept: {
      code: string; name: string; full_name?: string; parent_id?: string | null;
      sort_order?: number; color?: string; description?: string; long_description?: string;
      vfp?: string; goal?: string; manager_name?: string; main_stat?: string;
    }) => {
      const { data, error } = await supabase.from('departments').insert([dept]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Подразделение создано');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Подразделение удалено');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Diagnostics CRUD ───
export function useDepartmentDiagnostics(departmentId: string | null) {
  return useQuery({
    queryKey: ['dept-diagnostics', departmentId],
    enabled: !!departmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_diagnostics')
        .select('*')
        .eq('department_id', departmentId!)
        .order('sort_order');
      if (error) throw error;
      return data as Array<{ id: string; department_id: string; type: string; text: string; sort_order: number }>;
    },
  });
}

export function useSaveDiagnostics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ departmentId, items }: {
      departmentId: string;
      items: Array<{ type: string; text: string; sort_order: number }>;
    }) => {
      // Delete existing
      await supabase.from('department_diagnostics').delete().eq('department_id', departmentId);
      // Insert new
      if (items.length > 0) {
        const { error } = await supabase.from('department_diagnostics').insert(
          items.map(i => ({ ...i, department_id: departmentId }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dept-diagnostics', vars.departmentId] });
      toast.success('Диагностика сохранена');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Statistic Definitions CRUD ───
export function useCreateStatDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (def: {
      owner_type: string; owner_id: string; title: string; description?: string;
      is_double?: boolean; calculation_method?: string; purpose?: string; inverted?: boolean;
    }) => {
      const { data, error } = await supabase.from('statistic_definitions').insert([def]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stat-definitions'] });
      toast.success('Статистика создана');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStatDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('statistic_definitions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stat-definitions'] });
      toast.success('Статистика обновлена');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStatDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('statistic_definitions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stat-definitions'] });
      toast.success('Статистика удалена');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
