import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Download, Loader2, X, ZoomIn, FileImage, File } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  employeeId: string;
  stepId: string;
  onHasArtifact?: (has: boolean) => void;
}

interface Artifact {
  id: string;
  file_name: string;
  file_size: number | null;
  public_url: string | null;
  storage_path: string;
  file_type?: string | null;
}

function getFileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isImage(name: string, type?: string | null) {
  const ext = getFileExt(name);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
    || (type?.startsWith('image/') ?? false);
}

function isPdf(name: string, type?: string | null) {
  return getFileExt(name) === 'pdf' || type === 'application/pdf';
}

function FileIcon({ name, type }: { name: string; type?: string | null }) {
  if (isImage(name, type)) return <FileImage size={14} className="text-blue-400 flex-shrink-0" />;
  if (isPdf(name, type)) return <FileText size={14} className="text-red-400 flex-shrink-0" />;
  return <File size={14} className="text-muted-foreground flex-shrink-0" />;
}

function PreviewModal({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  const isImg = isImage(artifact.file_name, artifact.file_type);
  const isPDF = isPdf(artifact.file_name, artifact.file_type);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon name={artifact.file_name} type={artifact.file_type} />
            <span className="text-sm font-display font-bold text-foreground truncate">{artifact.file_name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {artifact.public_url && (
              <a
                href={artifact.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                title="Открыть в новой вкладке"
              >
                <Download size={14} />
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/20 min-h-[300px]">
          {artifact.public_url && isImg && (
            <img
              src={artifact.public_url}
              alt={artifact.file_name}
              className="max-w-full max-h-[75vh] object-contain"
            />
          )}
          {artifact.public_url && isPDF && (
            <iframe
              src={artifact.public_url}
              title={artifact.file_name}
              className="w-full h-[75vh]"
            />
          )}
          {!isImg && !isPDF && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
              <File size={48} />
              <p className="text-sm">Предпросмотр недоступен</p>
              {artifact.public_url && (
                <a
                  href={artifact.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                >
                  Скачать файл
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StepArtifactUpload({ courseId, employeeId, stepId, onHasArtifact }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Artifact | null>(null);

  const { data: artifacts } = useQuery<Artifact[]>({
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

  useEffect(() => {
    onHasArtifact?.((artifacts?.length ?? 0) > 0);
  }, [artifacts?.length]);

  const deleteMut = useMutation({
    mutationFn: async (artifact: Artifact) => {
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
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Артефакты</p>

        {artifacts && artifacts.length > 0 && (
          <div className="space-y-1">
            {artifacts.map(a => {
              const canPreview = isImage(a.file_name, a.file_type) || isPdf(a.file_name, a.file_type);
              return (
                <div key={a.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 group">
                  {/* Thumbnail for images */}
                  {isImage(a.file_name, a.file_type) && a.public_url ? (
                    <button
                      onClick={() => setPreview(a)}
                      className="flex-shrink-0 w-9 h-9 rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all relative"
                      title="Просмотреть"
                    >
                      <img src={a.public_url} alt={a.file_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                        <ZoomIn size={12} className="text-white" />
                      </div>
                    </button>
                  ) : (
                    <FileIcon name={a.file_name} type={a.file_type} />
                  )}

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setPreview(a)}
                      disabled={!canPreview && !a.public_url}
                      className="text-xs font-body text-foreground truncate block w-full text-left hover:text-primary transition-colors disabled:cursor-default"
                      title={canPreview ? 'Просмотреть' : a.file_name}
                    >
                      {a.file_name}
                    </button>
                    <p className="text-[10px] text-muted-foreground">{formatSize(a.file_size)}</p>
                  </div>

                  {canPreview && (
                    <button
                      onClick={() => setPreview(a)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Просмотреть"
                    >
                      <ZoomIn size={12} />
                    </button>
                  )}

                  {a.public_url && (
                    <a
                      href={a.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Скачать"
                    >
                      <Download size={12} />
                    </a>
                  )}

                  <button
                    onClick={() => deleteMut.mutate(a)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
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

      {preview && <PreviewModal artifact={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
