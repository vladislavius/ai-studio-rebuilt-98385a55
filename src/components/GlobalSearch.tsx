import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, BookOpen, Building2, ArrowRight } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: Props) {
  const [, setParams] = useSearchParams();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const { data: courses } = useQuery({
    queryKey: ['courses-search'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('id, title, is_published').order('title');
      return data ?? [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  const go = (updates: Record<string, string>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => next.set(k, v));
      return next;
    });
    onOpenChange(false);
  };

  const rootDepts = (departments ?? []).filter(d => !d.parent_id);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Поиск сотрудников, курсов, департаментов..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>

        {(employees ?? []).length > 0 && (
          <CommandGroup heading="Сотрудники">
            {(employees ?? []).slice(0, 6).map(emp => (
              <CommandItem
                key={emp.id}
                value={`${emp.full_name} ${emp.position ?? ''}`}
                onSelect={() => go({ view: 'employees', sub: 'list', list_sub: 'employees' })}
                className="gap-2"
              >
                <User size={14} className="text-muted-foreground shrink-0" />
                <span className="font-display font-medium">{emp.full_name}</span>
                {emp.position && (
                  <span className="text-xs text-muted-foreground truncate">{emp.position}</span>
                )}
                <ArrowRight size={12} className="ml-auto text-muted-foreground/50 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(courses ?? []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Курсы">
              {(courses ?? []).slice(0, 5).map(course => (
                <CommandItem
                  key={course.id}
                  value={`курс ${course.title}`}
                  onSelect={() => go({ view: 'academy' })}
                  className="gap-2"
                >
                  <BookOpen size={14} className="text-muted-foreground shrink-0" />
                  <span className="font-display font-medium">{course.title}</span>
                  <span className={`ml-auto text-[10px] font-bold uppercase shrink-0 ${course.is_published ? 'text-primary' : 'text-muted-foreground'}`}>
                    {course.is_published ? 'опубликован' : 'черновик'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {rootDepts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Департаменты">
              {rootDepts.slice(0, 5).map(dept => (
                <CommandItem
                  key={dept.id}
                  value={`департамент ${dept.name} ${dept.full_name ?? ''}`}
                  onSelect={() => go({ view: 'org_chart' })}
                  className="gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: dept.color ?? 'hsl(var(--muted-foreground))' }}
                  />
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  <span className="font-display font-medium">{dept.name}</span>
                  {dept.full_name && (
                    <span className="text-xs text-muted-foreground truncate">{dept.full_name}</span>
                  )}
                  <ArrowRight size={12} className="ml-auto text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
