import { supabase } from '@/integrations/supabase/client';

export async function fetchEmployees() {
  const result = await supabase
    .from('employees')
    .select('*')
    .order('full_name');
  return { data: result.data, error: result.error };
}

export async function createEmployee(employee: {
  full_name: string;
  position?: string;
  [key: string]: unknown;
}) {
  if (!employee.full_name) {
    return { data: null, error: { message: 'full_name is required' } };
  }

  const result = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single();
  return { data: result.data, error: result.error };
}

export async function updateEmployee(
  id: string,
  updates: Record<string, unknown>
) {
  const result = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data: result.data, error: result.error };
}

export async function deleteEmployee(id: string) {
  const result = await supabase
    .from('employees')
    .delete()
    .eq('id', id);
  return { data: result.data, error: result.error };
}
