import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_LABELS } from '@/constants/labels';
import { useCallback } from 'react';

const LABEL_PREFIX = 'label.';

export function useLabels() {
  const qc = useQueryClient();

  const { data: overrides } = useQuery({
    queryKey: ['label-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .like('key', 'label.%');
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach(r => {
        map[r.key.slice(LABEL_PREFIX.length)] = r.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const t = useCallback((key: string): string => {
    return overrides?.[key] ?? DEFAULT_LABELS[key] ?? key;
  }, [overrides]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const dbKey = LABEL_PREFIX + key;
      // Check if default - if so, delete override
      if (value === DEFAULT_LABELS[key]) {
        await supabase.from('company_settings').delete().eq('key', dbKey);
        return;
      }
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('key', dbKey)
        .maybeSingle();
      if (existing) {
        await supabase.from('company_settings').update({ value }).eq('key', dbKey);
      } else {
        await supabase.from('company_settings').insert({ key: dbKey, value });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['label-overrides'] });
    },
  });

  const saveLabel = useCallback((key: string, value: string) => {
    saveMutation.mutate({ key, value });
  }, [saveMutation]);

  return { t, saveLabel, overrides: overrides ?? {} };
}
