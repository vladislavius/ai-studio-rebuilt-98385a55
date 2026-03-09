import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ─── Types ───
export interface AdminScaleStep {
  id: string;
  name: string;
  type: 'primary' | 'vital' | 'conditional' | 'operating' | 'production';
  deadline: string;
  responsible: string;
  notes: string;
  done: boolean;
  project: AdminScaleProject | null;
}

export interface AdminScaleProject {
  name: string;
  steps: { id: string; text: string; responsible: string }[];
}

export interface AdminScaleProgram {
  id: string;
  name: string;
  mainTask: string;
  steps: AdminScaleStep[];
}

export interface AdminScale {
  id: string;
  name: string;
  created: string;
  goal: string;
  purpose: string;
  policy: string;
  plan: string;
  ideal: string;
  stats: string;
  vfp: string;
  programs: AdminScaleProgram[];
}

export const STEP_TYPES = {
  primary:     { label: 'Первоочередная',   icon: '👥', hint: 'Организационные, кадровые, коммуникационные шаги. Без них программа рухнет.' },
  vital:       { label: 'Жизненно важная',  icon: '⚠',  hint: 'Формируются после инспекции. Устраняют угрозы выживанию.' },
  conditional: { label: 'Условная',         icon: '🔍', hint: '«Если…то». Разведка, сбор данных, проверка осуществимости.' },
  operating:   { label: 'Текущая (рабочая)',icon: '⚙',  hint: 'Конкретные действия: кто, что, когда.' },
  production:  { label: 'Производственная', icon: '📊', hint: 'Квоты. Работают ТОЛЬКО вместе со всеми остальными типами!' },
} as const;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function emptyScale(name?: string): AdminScale {
  return {
    id: uid(), name: name || 'Новая шкала', created: new Date().toISOString(),
    goal: '', purpose: '', policy: '', plan: '', ideal: '', stats: '', vfp: '', programs: [],
  };
}

export function emptyProgram(n: number): AdminScaleProgram {
  return { id: uid(), name: `Программа ${n}`, mainTask: '', steps: [] };
}

export function emptyStep(n: number, type: AdminScaleStep['type'] = 'operating'): AdminScaleStep {
  return { id: uid(), name: `Задача ${n}`, type, deadline: '', responsible: '', notes: '', done: false, project: null };
}

// ─── Hook ───
export function useAdminScales() {
  const [scales, setScales] = useState<AdminScale[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const currentScale = scales.find(s => s.id === currentId) ?? null;

  // Load
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('adminscale_scales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setScales(data.map((r: any) => r.data as AdminScale));
      }
      setLoading(false);
    })();
  }, [user]);

  const save = useCallback(async (updatedScales: AdminScale[]) => {
    setScales(updatedScales);
    if (!user) return;
    // Upsert all
    const rows = updatedScales.map(s => ({
      id: s.id,
      user_id: user.id,
      name: s.name,
      data: s as any,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      await supabase.from('adminscale_scales').upsert(rows, { onConflict: 'id' });
    }
  }, [user]);

  const createScale = useCallback((name: string) => {
    const s = emptyScale(name);
    const updated = [...scales, s];
    save(updated);
    setCurrentId(s.id);
    return s;
  }, [scales, save]);

  const deleteScale = useCallback(async (id: string) => {
    const updated = scales.filter(s => s.id !== id);
    save(updated);
    if (currentId === id) setCurrentId(null);
    await supabase.from('adminscale_scales').delete().eq('id', id);
  }, [scales, currentId, save]);

  const updateScale = useCallback((id: string, updater: (s: AdminScale) => AdminScale) => {
    const updated = scales.map(s => s.id === id ? updater({ ...s }) : s);
    save(updated);
  }, [scales, save]);

  return {
    scales, currentScale, currentId, setCurrentId, loading,
    createScale, deleteScale, updateScale,
  };
}

// ─── Templates ───
export function buildWifeTemplate(): AdminScale {
  const s = emptyScale('Вечер с женой');
  s.goal = 'Счастливая семейная жизнь';
  s.purpose = 'Устроить приятный вечер с женой';
  s.policy = 'Всегда уделять внимание жене';
  s.plan = 'Кино → Ресторан → Прогулка';
  s.ideal = 'Счастливая жена, прекрасный вечер, укрепление отношений';
  s.stats = 'Количество совместных вечеров в месяц';
  s.vfp = 'Счастливая пара, крепкие отношения';
  const p = emptyProgram(1);
  p.name = 'Организация вечера';
  p.mainTask = 'Провести незабываемый вечер с женой';
  const mkStep = (name: string, type: AdminScaleStep['type'], notes = '') => {
    const st = emptyStep(0, type); st.name = name; st.notes = notes; return st;
  };
  p.steps = [
    mkStep('Узнать какой фильм жена хочет посмотреть', 'primary'),
    mkStep('Забронировать столик в ресторане', 'operating'),
    mkStep('Купить билеты в кино', 'operating'),
    mkStep('УСЛОВНАЯ: Если ресторан занят — выбрать альтернативу', 'conditional'),
    mkStep('Проверить маршрут прогулки', 'vital'),
  ];
  s.programs = [p];
  return s;
}

export function buildMarketingTemplate(): AdminScale {
  const s = emptyScale('Маркетинговое агентство');
  s.goal = 'Лидирующее маркетинговое агентство в регионе';
  s.purpose = 'Увеличить клиентскую базу на 50% через новые соцсети';
  s.policy = 'Качество контента важнее количества';
  s.plan = 'Расширить присутствие в соцсетях, запустить новые каналы привлечения';
  s.ideal = 'Постоянный поток клиентов, высокая репутация, стабильный рост';
  s.stats = 'Количество новых клиентов в месяц, ROI маркетинговых кампаний';
  s.vfp = 'Успешные маркетинговые кампании с измеримыми результатами';
  const p = emptyProgram(1);
  p.name = 'Расширение соцсетей';
  p.mainTask = 'Привлечь 50 новых клиентов через соцсети за квартал';
  const mkStep = (name: string, type: AdminScaleStep['type']) => {
    const st = emptyStep(0, type); st.name = name; return st;
  };
  p.steps = [
    mkStep('Провести аудит текущих соцсетей', 'primary'),
    mkStep('Составить контент-план на месяц', 'operating'),
    mkStep('Запустить таргетированную рекламу', 'operating'),
    mkStep('УСЛОВНАЯ: Если CTR ниже 2% — пересмотреть креативы', 'conditional'),
    mkStep('Публиковать минимум 5 постов в неделю', 'production'),
  ];
  s.programs = [p];
  return s;
}
