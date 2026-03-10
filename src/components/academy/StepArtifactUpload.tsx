import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  employeeId: string;
  stepId: string;
}

export function StepArtifactUpload({ courseId, employeeId, stepId }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: artifacts } = useQuery({
    queryKey: ['step-artifacts', courseId, employeeId, stepId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('step_artifacts')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .eq('step_id', stepId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Максимальный размер файла: 50 МБ');
      return;
    }
    setUploading(true);
    try {
      const path = `${courseId}/${employeeId}/${stepId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('course-artifacts').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('course-artifacts').getPublicUrl(path);

      const { error: insertErr } = await supabase.from('step_artifacts').insert([{
        course_id: courseId,
        employee_id: employeeId,
        step_id: stepId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        public_url: urlData.publicUrl,
      }]);
      if (insertErr) throw insertErr;

      toast.success('Файл загружен');
      qc.invalidateQueries({ queryKey: ['step-artifacts', courseId, employeeId, stepId] });
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteMut = useMutation({
    mutationFn: async (artifact: { id: string; storage_path: string }) => {
      await supabase.storage.from('course-artifacts').remove([artifact.storage_path]);
      const { error } = await supabase.from('step_artifacts').delete().eq('id', artifact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Файл удалён');
      qc.invalidateQueries({ queryKey: ['step-artifacts', courseId, employeeId, stepId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Артефакты</p>

      {artifacts && artifacts.length > 0 && (
        <div className="space-y-1">
          {artifacts.map(a => (
            <div key={a.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <FileText size={14} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-foreground truncate">{a.file_name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(a.file_size)}</p>
              </div>
              {a.public_url && (
                <a href={a.public_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent text-muted-foreground">
                  <Download size={12} />
                </a>
              )}
              <button onClick={() => deleteMut.mutate({ id: a.id, storage_path: a.storage_path })} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 border border-dashed border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1.5 w-full justify-center disabled:opacity-50"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Загрузка...' : 'Загрузить файл'}
      </button>
    </div>
  );
}
