import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useStatisticDefinitions(ownerType?: string, ownerId?: string) {
  return useQuery({
    queryKey: ['stat-definitions', ownerType ?? 'all', ownerId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('statistic_definitions').select('*').order('title');
      if (ownerType) q = q.eq('owner_type', ownerType);
      if (ownerId) q = q.eq('owner_id', ownerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useStatisticValues(definitionId: string | null) {
  return useQuery({
    queryKey: ['stat-values', definitionId],
    enabled: !!definitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statistic_values')
        .select('*')
        .eq('definition_id', definitionId!)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateStatValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (val: { definition_id: string; date: string; value: number; value2?: number; condition?: string; notes?: string; created_by?: string }) => {
      const { data, error } = await supabase
        .from('statistic_values')
        .insert([val])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['stat-values', vars.definition_id] });
      toast.success('Значение добавлено');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
