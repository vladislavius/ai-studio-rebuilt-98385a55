import { useState } from 'react';
import { DEFAULT_LABELS, LABEL_GROUPS } from '@/constants/labels';
import { useLabels } from '@/hooks/useLabels';
import { Search, RotateCcw, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function TerminologyEditor() {
  const { t, saveLabel, overrides } = useLabels();
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const allKeys = Object.keys(DEFAULT_LABELS);
  const filteredKeys = search
    ? allKeys.filter(k => 
        k.toLowerCase().includes(search.toLowerCase()) ||
        DEFAULT_LABELS[k].toLowerCase().includes(search.toLowerCase()) ||
        (overrides[k] ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allKeys;

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(overrides[key] ?? DEFAULT_LABELS[key]);
  };

  const saveEdit = () => {
    if (editingKey && editValue.trim()) {
      saveLabel(editingKey, editValue.trim());
      toast.success('Термин сохранён');
    }
    setEditingKey(null);
  };

  const resetToDefault = (key: string) => {
    saveLabel(key, DEFAULT_LABELS[key]);
    toast.success('Сброшено к значению по умолчанию');
  };

  const getGroupKeys = (prefix: string) =>
    filteredKeys.filter(k => k.startsWith(prefix));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-foreground text-lg">Редактор терминологии</h2>
          <p className="text-xs text-muted-foreground font-body">
            Нажмите на любой термин чтобы изменить его. Изменения применяются ко всей платформе.
          </p>
        </div>
        <span className="text-[10px] font-display font-bold text-muted-foreground bg-accent px-2 py-1 rounded">
          {Object.keys(overrides).length} изменено из {allKeys.length}
        </span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по терминам..."
          className="pl-9 bg-background"
        />
      </div>

      <div className="space-y-2">
        {LABEL_GROUPS.map(group => {
          const keys = getGroupKeys(group.prefix);
          if (keys.length === 0) return null;
          const isExpanded = expandedGroup === group.key || !!search;
          const hasOverrides = keys.some(k => overrides[k] !== undefined);

          return (
            <div key={group.key} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isExpanded && !search ? null : group.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold text-foreground">{group.title}</span>
                  <span className="text-[10px] text-muted-foreground font-display">{keys.length} терминов</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasOverrides && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-display font-bold">
                      Изменено
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {keys.map(key => {
                    const isCustomized = overrides[key] !== undefined;
                    const isEditingThis = editingKey === key;
                    const currentValue = overrides[key] ?? DEFAULT_LABELS[key];

                    return (
                      <div key={key} className={`flex items-center gap-3 px-3 py-2 ${isCustomized ? 'bg-primary/5' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-mono">{key}</p>
                          {isEditingThis ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingKey(null); }}
                                className="flex-1 bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 font-body"
                              />
                              <button onClick={saveEdit} className="p-1 text-primary hover:bg-primary/10 rounded">
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <p
                              className="text-sm font-body text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => startEdit(key)}
                            >
                              {currentValue}
                              {isCustomized && (
                                <span className="text-[10px] text-muted-foreground ml-2">(было: {DEFAULT_LABELS[key]})</span>
                              )}
                            </p>
                          )}
                        </div>
                        {isCustomized && !isEditingThis && (
                          <button
                            onClick={() => resetToDefault(key)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                            title="Сбросить к значению по умолчанию"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
