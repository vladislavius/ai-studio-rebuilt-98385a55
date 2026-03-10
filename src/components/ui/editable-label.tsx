import { useState, useRef, useEffect } from 'react';
import { useLabels } from '@/hooks/useLabels';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditableLabelProps {
  labelKey: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'label';
  className?: string;
  fallback?: string;
  /** If true, show edit icon on hover even for non-admins */
  alwaysEditable?: boolean;
}

export function EditableLabel({
  labelKey,
  as: Tag = 'span',
  className,
  fallback,
  alwaysEditable = false,
}: EditableLabelProps) {
  const { t, saveLabel } = useLabels();
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const canEdit = isAdmin || alwaysEditable;

  const text = fallback ? t(labelKey) || fallback : t(labelKey);

  const startEdit = () => {
    if (!canEdit) return;
    setValue(text);
    setIsEditing(true);
  };

  const save = () => {
    if (value.trim() && value !== text) {
      saveLabel(labelKey, value.trim());
      toast.success('Сохранено');
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          className="bg-primary/5 border border-primary/30 rounded px-1.5 py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50"
          style={{ fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit' }}
        />
        <button onClick={save} className="p-0.5 text-primary hover:bg-primary/10 rounded">
          <Check size={12} />
        </button>
        <button onClick={cancel} className="p-0.5 text-muted-foreground hover:bg-muted rounded">
          <X size={12} />
        </button>
      </span>
    );
  }

  return (
    <Tag
      className={cn(
        canEdit && 'group/editable cursor-pointer relative',
        className
      )}
      onClick={canEdit ? startEdit : undefined}
      title={canEdit ? `Нажмите для редактирования (${labelKey})` : undefined}
    >
      {text}
      {canEdit && (
        <Pencil
          size={10}
          className="inline-block ml-1 opacity-0 group-hover/editable:opacity-40 transition-opacity"
        />
      )}
    </Tag>
  );
}

/** Simple hook-based label getter without inline editing */
export function useLabel(key: string): string {
  const { t } = useLabels();
  return t(key);
}
