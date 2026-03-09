import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBDepartment {
  id: string;
  code: string;
  name: string;
  full_name: string | null;
  color: string | null;
  icon: string | null;
  description: string | null;
  long_description: string | null;
  manager_name: string | null;
  goal: string | null;
  vfp: string | null;
  main_stat: string | null;
  sort_order: number | null;
  parent_id: string | null;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DBDepartment[];
    },
  });
}
