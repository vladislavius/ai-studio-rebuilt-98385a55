import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export function SupervisorAssignment() {
  const qc = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, email');
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, display_name, email');
      if (error) throw error;
      return data;
    },
  });

  const { data: supervisorRoles } = useQuery({
    queryKey: ['supervisor-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, role');
      if (error) throw error;
      return data?.filter(r => r.role === 'admin' || r.role === 'supervisor') || [];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['course-supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_supervisors').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['all-course-progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_progress').select('course_id, employee_id');
      if (error) throw error;
      return data;
    },
  });

  const assignMut = useMutation({
    mutationFn: async ({ courseId, employeeId, supervisorUserId }: { courseId: string; employeeId: string; supervisorUserId: string }) => {
      const { error } = await supabase.from('course_supervisors').upsert({
        course_id: courseId,
        employee_id: employeeId,
        supervisor_user_id: supervisorUserId,
      }, { onConflict: 'course_id,employee_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-supervisors'] });
      toast.success('Супервизор назначен');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_supervisors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-supervisors'] });
      toast.success('Назначение удалено');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const empMap = new Map(employees?.map(e => [e.id, e]) || []);
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
  const supervisorUsers = supervisorRoles?.map(r => {
    const profile = profileMap.get(r.user_id);
    return { userId: r.user_id, name: profile?.display_name || profile?.email || r.user_id, role: r.role };
  }) || [];

  const courseAssignments = assignments?.filter(a => !selectedCourse || a.course_id === selectedCourse) || [];
  const courseStudents = selectedCourse
    ? progress?.filter(p => p.course_id === selectedCourse).map(p => p.employee_id) || []
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-primary" />
        <h3 className="text-sm font-display font-bold text-foreground">Назначение супервизоров</h3>
      </div>

      <select
        value={selectedCourse}
        onChange={e => setSelectedCourse(e.target.value)}
        className="w-full h-9 text-xs bg-background border border-border rounded-lg px-3"
      >
        <option value="">Все курсы</option>
        {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {courseAssignments.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <UserPlus size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет назначений{selectedCourse ? ' для этого курса' : ''}</p>
        </div>
      )}

      {courseAssignments.map(a => {
        const emp = empMap.get(a.employee_id);
        const supervisor = profileMap.get(a.supervisor_user_id);
        return (
          <div key={a.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-foreground">{emp?.full_name || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Супервизор: {supervisor?.display_name || supervisor?.email || '—'}</p>
            </div>
            <button onClick={() => removeMut.mutate(a.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      {/* Quick assign */}
      {selectedCourse && courseStudents.length > 0 && supervisorUsers.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Быстрое назначение</p>
          {courseStudents.map(empId => {
            const emp = empMap.get(empId);
            const existing = assignments?.find(a => a.course_id === selectedCourse && a.employee_id === empId);
            if (existing) return null;
            return (
              <div key={empId} className="flex items-center gap-2">
                <span className="text-xs font-body text-foreground flex-1">{emp?.full_name || '—'}</span>
                <select
                  onChange={e => {
                    if (e.target.value) assignMut.mutate({ courseId: selectedCourse, employeeId: empId, supervisorUserId: e.target.value });
                    e.target.value = '';
                  }}
                  className="h-7 text-[10px] bg-background border border-border rounded px-2"
                  defaultValue=""
                >
                  <option value="" disabled>Назначить...</option>
                  {supervisorUsers.map(s => <option key={s.userId} value={s.userId}>{s.name}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
