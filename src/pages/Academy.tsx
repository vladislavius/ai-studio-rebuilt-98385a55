import { useState } from 'react';
import { GraduationCap, BookOpen, Plus, Trash2, Eye, EyeOff, ArrowLeft, ClipboardList, BarChart3, FileText, Search as SearchIcon, ClipboardCheck, AlertTriangle, Layers, Users, RefreshCw, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CourseChecksheet } from '@/components/academy/CourseChecksheet';
import { CourseStudyView } from '@/components/academy/CourseStudyView';
import { ProgressDashboard } from '@/components/academy/ProgressDashboard';
import { AcademyDocsPage } from '@/components/academy/AcademyDocsPage';
import { GlossaryManager } from '@/components/academy/GlossaryManager';
import { CheckoutReviewPanel } from '@/components/academy/CheckoutReviewPanel';
import { BarriersAnalytics } from '@/components/academy/BarriersAnalytics';
import { ProgramsManager } from '@/components/academy/ProgramsManager';
import { SupervisorAssignment } from '@/components/academy/SupervisorAssignment';
import { SupervisorDashboard } from '@/components/academy/SupervisorDashboard';
import { TwinningManager } from '@/components/academy/TwinningManager';
import { Leaderboard } from '@/components/academy/LeaderboardAndBadges';
import { ExtraAssignmentsManager } from '@/components/academy/SupervisorTools';
import { StudentPortal } from '@/components/academy/StudentPortal';

type View = 'list' | 'detail' | 'study';
type StatusFilter = 'all' | 'published' | 'draft' | 'hst';

export function AcademyPage() {
  const { isAdmin, isSupervisor, isAuthor, user } = useAuth();
  const { t } = useLabels();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_hours: '' });
  const [courseSearch, setCourseSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Find employee record matching current user's email
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from('employees').select('id, full_name').eq('email', user.email).maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // For students: fetch assigned course IDs (supervisor assignments union in-progress courses)
  const { data: myAssignedCourseIds } = useQuery({
    queryKey: ['my-assigned-courses', myEmployee?.id],
    queryFn: async () => {
      if (!myEmployee?.id) return null; // null = no filter, show all published
      const [{ data: supervised }, { data: inProgress }] = await Promise.all([
        supabase.from('course_supervisors').select('course_id').eq('employee_id', myEmployee.id),
        supabase.from('course_progress').select('course_id').eq('employee_id', myEmployee.id),
      ]);
      const ids = new Set([
        ...(supervised ?? []).map(r => r.course_id),
        ...(inProgress ?? []).map(r => r.course_id),
      ]);
      return ids.size > 0 ? [...ids] as string[] : null; // null = show all published (new student)
    },
    enabled: !!myEmployee?.id && !isAdmin && !isAuthor,
  });

  // For students: fetch my progress to show bars on cards
  const { data: myProgress } = useQuery({
    queryKey: ['my-progress-all', myEmployee?.id],
    queryFn: async () => {
      if (!myEmployee?.id) return [] as { course_id: string; progress_percent: number }[];
      const { data } = await supabase
        .from('course_progress')
        .select('course_id, progress_percent')
        .eq('employee_id', myEmployee.id);
      return (data ?? []) as { course_id: string; progress_percent: number }[];
    },
    enabled: !!myEmployee?.id && !isAdmin && !isAuthor,
  });

  const createMut = useMutation({
    mutationFn: async (c: typeof form) => {
      const { error } = await supabase.from('courses').insert([{
        title: c.title,
        description: c.description || null,
        duration_hours: c.duration_hours ? parseFloat(c.duration_hours) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Курс создан'); setShowForm(false); setForm({ title: '', description: '', duration_hours: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('courses').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Курс удалён'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (id: string) => { setSelectedCourseId(id); setView('detail'); };
  const openStudy = (id: string) => { setSelectedCourseId(id); setView('study'); };
  const backToList = () => { setView('list'); setSelectedCourseId(null); };

  if (view === 'detail' && selectedCourseId) {
    return <CourseChecksheet courseId={selectedCourseId} onBack={backToList} />;
  }
  if (view === 'study' && selectedCourseId) {
    return <CourseStudyView courseId={selectedCourseId} onBack={backToList} employeeId={myEmployee?.id} />;
  }

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">{t('academy.loading')}</div>;

  const isManager = isAdmin || isAuthor;

  // Students get their own personal learning portal instead of the admin tabs view
  if (!isManager && !isSupervisor) {
    return (
      <StudentPortal
        employeeId={myEmployee?.id ?? null}
        employeeName={(myEmployee as any)?.full_name ?? null}
        onStudyCourse={openStudy}
      />
    );
  }
  const allItems = courses ?? [];
  const items = allItems.filter(c => {
    const matchSearch = !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && c.is_published) ||
      (statusFilter === 'draft' && !c.is_published) ||
      (statusFilter === 'hst' && c.is_hst_course);
    // Students (non-admin, non-author) see only assigned published courses
    // null myAssignedCourseIds = new student with no assignments → show all published
    if (!isManager && !isSupervisor) {
      if (!c.is_published) return false;
      if (myAssignedCourseIds !== null && myAssignedCourseIds !== undefined) {
        return matchSearch && matchStatus && myAssignedCourseIds.includes(c.id);
      }
      return matchSearch && matchStatus;
    }
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <EditableLabel labelKey="academy.title" as="h1" className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-1" />
          <p className="text-sm text-muted-foreground font-body flex items-center gap-2">
            <EditableLabel labelKey="academy.subtitle" />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-display font-bold">{allItems.length} {t('academy.courses_count')}</span>
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> <EditableLabel labelKey="academy.create_course" />
          </button>
        )}
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="flex-wrap">
          <TabsTrigger value="courses" className="flex items-center gap-1.5">
            <ClipboardList size={14} /> <EditableLabel labelKey="academy.tab.courses" />
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1.5">
            <BarChart3 size={14} /> <EditableLabel labelKey="academy.tab.progress" />
          </TabsTrigger>
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="checkouts" className="flex items-center gap-1.5">
              <ClipboardCheck size={14} /> <EditableLabel labelKey="academy.tab.checkouts" />
            </TabsTrigger>
          )}
          <TabsTrigger value="glossary" className="flex items-center gap-1.5">
            <SearchIcon size={14} /> <EditableLabel labelKey="academy.tab.glossary" />
          </TabsTrigger>
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="barriers" className="flex items-center gap-1.5">
              <AlertTriangle size={14} /> <EditableLabel labelKey="academy.tab.barriers" />
            </TabsTrigger>
          )}
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="twinning" className="flex items-center gap-1.5">
              <RefreshCw size={14} /> Твиннинг
            </TabsTrigger>
          )}
          <TabsTrigger value="programs" className="flex items-center gap-1.5">
            <Layers size={14} /> <EditableLabel labelKey="academy.tab.programs" />
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="supervisors" className="flex items-center gap-1.5">
              <Users size={14} /> <EditableLabel labelKey="academy.tab.supervisors" />
            </TabsTrigger>
          )}
          {isSupervisor && (
            <TabsTrigger value="my-students" className="flex items-center gap-1.5">
              <Users size={14} /> Мои студенты
            </TabsTrigger>
          )}
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="assignments" className="flex items-center gap-1.5">
              <ClipboardList size={14} /> Задания
            </TabsTrigger>
          )}
          <TabsTrigger value="leaderboard" className="flex items-center gap-1.5">
            <Trophy size={14} /> Рейтинг
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-1.5">
            <FileText size={14} /> <EditableLabel labelKey="academy.tab.docs" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {/* Search + status filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
              />
            </div>
            <div className="flex gap-1 bg-accent border border-border rounded-xl p-1">
              {(['all', 'published', 'draft', 'hst'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {{ all: 'Все', published: 'Активные', draft: 'Черновики', hst: 'HST' }[s]}
                </button>
              ))}
            </div>
          </div>

          {showForm && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3 mb-4">
              <p className="text-sm font-display font-bold text-foreground">{t('academy.new_course')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">{t('academy.course_name')} *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-background" /></div>
                <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">{t('academy.course_duration')}</label><Input type="number" value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} className="bg-background" /></div>
              </div>
              <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">{t('academy.course_description')}</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="bg-background resize-none" /></div>
              <div className="flex gap-2">
                <button onClick={() => createMut.mutate(form)} disabled={!form.title} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50">{t('academy.btn_create')}</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">{t('academy.btn_cancel')}</button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} className="text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-body text-sm">
                {allItems.length === 0 ? t('academy.no_courses') : 'Ничего не найдено по фильтрам'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(course => {
                const sections = Array.isArray(course.sections) ? course.sections.length : 0;
                const myProg = myProgress?.find(p => p.course_id === course.id);
                return (
                  <div key={course.id} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 group relative cursor-pointer"
                    onClick={() => isManager ? openDetail(course.id) : openStudy(course.id)}>
                    {isManager && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={e => { e.stopPropagation(); togglePublish.mutate({ id: course.id, published: !course.is_published }); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground" title={course.is_published ? 'Снять с публикации' : 'Опубликовать'}>
                          {course.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); openStudy(course.id); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Превью прохождения">
                          <BookOpen size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={e => { e.stopPropagation(); if (confirm(t('academy.delete_course'))) deleteMut.mutate(course.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shadow-sm">
                        <ClipboardList size={20} className="text-primary" />
                      </div>
                      <span className={`text-[10px] font-display font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${course.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {course.is_published ? t('academy.status_active') : t('academy.status_draft')}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                    {course.description && <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{course.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body flex-wrap">
                      <span className="flex items-center gap-1"><ClipboardList size={10} />{sections} {t('academy.items_count')}</span>
                      {course.duration_hours && <span className="flex items-center gap-1"><GraduationCap size={10} />{course.duration_hours} ч.</span>}
                      {course.is_hst_course && <span className="text-primary font-display font-bold px-1.5 py-0.5 bg-primary/10 rounded text-[10px]">HST</span>}
                    </div>
                    {myProg !== undefined && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-muted-foreground font-display font-bold uppercase tracking-wide">Прогресс</span>
                          <span className={`text-[10px] font-display font-bold ${myProg.progress_percent >= 100 ? 'text-emerald-500' : 'text-primary'}`}>{myProg.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all duration-500 ${myProg.progress_percent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary to-primary/70'}`} style={{ width: `${myProg.progress_percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <ProgressDashboard />
        </TabsContent>

        {(isAdmin || isSupervisor) && (
          <TabsContent value="checkouts">
            <CheckoutReviewPanel />
          </TabsContent>
        )}

        <TabsContent value="glossary">
          <GlossaryManager />
        </TabsContent>

        {(isAdmin || isSupervisor) && (
          <TabsContent value="barriers">
            <BarriersAnalytics />
          </TabsContent>
        )}

        {(isAdmin || isSupervisor) && (
          <TabsContent value="twinning">
            <TwinningManager />
          </TabsContent>
        )}

        <TabsContent value="programs">
          <ProgramsManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="supervisors">
            <SupervisorAssignment />
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="my-students">
            <SupervisorDashboard />
          </TabsContent>
        )}

        {(isAdmin || isSupervisor) && (
          <TabsContent value="assignments">
            <ExtraAssignmentsManager />
          </TabsContent>
        )}

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="docs">
          <AcademyDocsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
