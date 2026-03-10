import { useState } from 'react';
import { GraduationCap, BookOpen, Plus, Trash2, Eye, EyeOff, ArrowLeft, ClipboardList, BarChart3, FileText, Search as SearchIcon, ClipboardCheck, AlertTriangle } from 'lucide-react';
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

type View = 'list' | 'detail' | 'study';

export function AcademyPage() {
  const { isAdmin, user } = useAuth();
  const { t } = useLabels();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_hours: '' });

  // Find employee record matching current user's email
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from('employees').select('id').eq('email', user.email).maybeSingle();
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
  const items = courses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <EditableLabel labelKey="academy.title" as="h1" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1" />
          <p className="text-sm text-muted-foreground font-body">
            <EditableLabel labelKey="academy.subtitle" /> • {items.length} {t('academy.courses_count')}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
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
          {isAdmin && (
            <TabsTrigger value="checkouts" className="flex items-center gap-1.5">
              <ClipboardCheck size={14} /> <EditableLabel labelKey="academy.tab.checkouts" />
            </TabsTrigger>
          )}
          <TabsTrigger value="glossary" className="flex items-center gap-1.5">
            <SearchIcon size={14} /> <EditableLabel labelKey="academy.tab.glossary" />
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="barriers" className="flex items-center gap-1.5">
              <AlertTriangle size={14} /> <EditableLabel labelKey="academy.tab.barriers" />
            </TabsTrigger>
          )}
          <TabsTrigger value="docs" className="flex items-center gap-1.5">
            <FileText size={14} /> <EditableLabel labelKey="academy.tab.docs" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
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
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <GraduationCap size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-body text-sm">{t('academy.no_courses')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(course => {
                const sections = Array.isArray(course.sections) ? course.sections.length : 0;
                return (
                  <div key={course.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all group relative cursor-pointer"
                    onClick={() => isAdmin ? openDetail(course.id) : openStudy(course.id)}>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={e => { e.stopPropagation(); togglePublish.mutate({ id: course.id, published: !course.is_published }); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground" title={course.is_published ? 'Снять с публикации' : 'Опубликовать'}>
                          {course.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); openStudy(course.id); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Превью прохождения">
                          <BookOpen size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (confirm(t('academy.delete_course'))) deleteMut.mutate(course.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList size={20} className="text-primary" />
                      </div>
                      <span className={`text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-1 rounded ${course.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {course.is_published ? t('academy.status_active') : t('academy.status_draft')}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    {course.description && <p className="text-xs text-muted-foreground font-body mb-2 line-clamp-2">{course.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                      <span>{sections} {t('academy.items_count')}</span>
                      {course.duration_hours && <span>{course.duration_hours} ч.</span>}
                      {course.is_hst_course && <span className="text-primary font-display font-bold">HST</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <ProgressDashboard />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="checkouts">
            <CheckoutReviewPanel />
          </TabsContent>
        )}

        <TabsContent value="glossary">
          <GlossaryManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="barriers">
            <BarriersAnalytics />
          </TabsContent>
        )}

        <TabsContent value="docs">
          <AcademyDocsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
