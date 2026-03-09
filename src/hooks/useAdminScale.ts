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

  const addFullScale = useCallback((scale: AdminScale) => {
    const updated = [...scales, scale];
    save(updated);
    setCurrentId(scale.id);
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

const mkStep = (name: string, type: AdminScaleStep['type'], notes = '', responsible = '') => {
  const st = emptyStep(0, type); st.name = name; st.notes = notes; st.responsible = responsible; return st;
};

export function buildWifeTemplate(): AdminScale {
  const s = emptyScale('Вечер с женой (пример из книги)');
  s.goal = 'Получить максимальное удовольствие от общения с женой и укрепить отношения';
  s.purpose = 'Устроить приятный вечер с женой — кино, ресторан, прогулка';
  s.policy = 'Всегда уделять внимание жене и учитывать её пожелания';
  s.plan = 'Кино → Ресторан → Прогулка по набережной';
  s.ideal = 'Счастливая жена, прекрасный вечер, укрепление отношений';
  s.stats = 'Количество совместных вечеров в месяц';
  s.vfp = 'Счастливая пара, крепкие отношения';

  const p1 = emptyProgram(1);
  p1.name = 'Организация вечера с женой';
  p1.mainTask = 'Провести незабываемый вечер с женой';
  p1.steps = [
    mkStep('Прочитайте эту программу и поймите её', 'primary', 'Необходимо понять всю программу целиком прежде чем приступать к её выполнению.'),
    mkStep('Узнать какой фильм жена хочет посмотреть', 'primary', 'Спросить жену о предпочтениях заранее.'),
    mkStep('Проверить расписание кинотеатров', 'primary'),
    mkStep('УСЛОВНАЯ: Если нет подходящего сеанса — выбрать альтернативу', 'conditional', 'Проверить другие кинотеатры или выбрать домашний просмотр.'),
    mkStep('Забронировать столик в ресторане', 'operating', 'Выбрать ресторан с учётом предпочтений жены.'),
    mkStep('УСЛОВНАЯ: Если ресторан занят — выбрать альтернативу', 'conditional'),
    mkStep('Купить билеты в кино', 'operating'),
    mkStep('Проверить маршрут прогулки', 'vital', 'Убедиться что маршрут безопасен и приятен.'),
    mkStep('Поддерживать хорошее настроение в течение вечера', 'vital'),
    mkStep('Подготовить подарок или сюрприз', 'operating'),
    mkStep('Провести не менее 1 такого вечера в неделю', 'production'),
    mkStep('Оценить вечер и записать что понравилось', 'operating'),
  ];

  p1.steps[4].project = {
    name: 'Выбор и бронирование ресторана',
    steps: [
      { id: uid(), text: 'Составить список из 3-5 ресторанов', responsible: '' },
      { id: uid(), text: 'Проверить отзывы и меню', responsible: '' },
      { id: uid(), text: 'Позвонить и забронировать', responsible: '' },
      { id: uid(), text: 'Подтвердить бронь за день до', responsible: '' },
    ],
  };

  s.programs = [p1];
  return s;
}

export function buildMarketingTemplate(): AdminScale {
  const s = emptyScale('Маркетинговое агентство: рост на 50%');
  s.goal = 'Стать самым прибыльным и эффективным маркетинговым агентством в регионе';
  s.purpose = 'Увеличить клиентскую базу на 50% через расширение присутствия в социальных сетях';
  s.policy = 'Качество контента важнее количества. Каждая публикация должна приносить измеримый результат.';
  s.plan = 'Расширить присутствие в соцсетях, запустить новые каналы привлечения клиентов';
  s.ideal = 'Постоянный поток клиентов, высокая репутация, стабильный рост доходов';
  s.stats = 'Количество новых клиентов в месяц, ROI маркетинговых кампаний, охват аудитории';
  s.vfp = 'Успешные маркетинговые кампании с измеримыми результатами для клиентов';

  const p1 = emptyProgram(1);
  p1.name = 'Расширение присутствия в соцсетях';
  p1.mainTask = 'Привлечь 50 новых клиентов через соцсети за квартал';
  p1.steps = [
    mkStep('Прочитайте программу целиком', 'primary'),
    mkStep('Назначить ответственного за соцсети', 'primary'),
    mkStep('Провести аудит текущих соцсетей', 'primary'),
    mkStep('УСЛОВНАЯ: Если нет SMM-специалиста — нанять', 'conditional'),
    mkStep('Поддерживать связь с отделом продаж', 'vital', 'Еженедельно сверять результаты с продажами.'),
    mkStep('Проводить инспекции контента', 'vital'),
    mkStep('УСЛОВНАЯ: Если CTR ниже 2% — пересмотреть креативы', 'conditional'),
    mkStep('Составить контент-план на месяц', 'operating'),
    mkStep('Запустить таргетированную рекламу', 'operating'),
    mkStep('Настроить аналитику и отслеживание', 'operating'),
    mkStep('Публиковать минимум 5 постов в неделю', 'production'),
    mkStep('Привлекать не менее 15 лидов в неделю', 'production'),
  ];

  const p2 = emptyProgram(2);
  p2.name = 'Запуск реферальной программы';
  p2.mainTask = 'Получить 20 клиентов через рекомендации за квартал';
  p2.steps = [
    mkStep('Изучить программу', 'primary'),
    mkStep('Связаться с текущими клиентами', 'primary'),
    mkStep('Разработать условия реферальной программы', 'operating'),
    mkStep('Подготовить промо-материалы', 'operating'),
    mkStep('УСЛОВНАЯ: Если отклик низкий — пересмотреть условия', 'conditional'),
    mkStep('Запустить программу', 'operating'),
    mkStep('Получить не менее 5 рекомендаций в неделю', 'production'),
  ];

  const p3 = emptyProgram(3);
  p3.name = 'Email-маркетинг';
  p3.mainTask = 'Построить базу из 1000 подписчиков и конвертировать 5%';
  p3.steps = [
    mkStep('Выбрать платформу для рассылок', 'primary'),
    mkStep('Создать лид-магнит', 'operating'),
    mkStep('Настроить воронку подписки', 'operating'),
    mkStep('УСЛОВНАЯ: Если open rate < 20% — тестировать темы', 'conditional'),
    mkStep('Отправлять минимум 2 рассылки в неделю', 'production'),
  ];

  s.programs = [p1, p2, p3];
  return s;
}

export function buildExcursionsTemplate(): AdminScale {
  const s = emptyScale('Экскурсии по компании (WISE)');
  s.goal = 'Массовое ознакомление новых людей с деятельностью организации и административной технологией';
  s.purpose = 'Организовать систему регулярных экскурсий по компании для новых людей';
  s.policy = 'Каждый посетитель должен получить полное представление о работе организации и увидеть результаты';
  s.plan = 'Создать маршрут экскурсии, подготовить гидов, запустить регулярные экскурсии';
  s.ideal = 'Поток посетителей, которые становятся клиентами или сотрудниками после экскурсии';
  s.stats = 'Количество экскурсий в неделю, число участников, конверсия в клиентов';
  s.vfp = 'Новая публика, получившая успех от знакомства с ЛРХ и административной технологией';

  const p1 = emptyProgram(1);
  p1.name = 'Подготовка к проведению экскурсий';
  p1.mainTask = 'Новая публика, получившая успех от знакомства с ЛРХ и административной технологией';
  p1.steps = [
    mkStep('Прочитайте эту программу и поймите её', 'primary', 'Необходимо понять всю программу целиком прежде чем приступать к её выполнению.', 'Член WISE'),
    mkStep('Назначьте ответственного за экскурсии', 'primary', '', 'Руководитель'),
    mkStep('Изучите ссылки и материалы по проведению экскурсий', 'primary'),
    mkStep('Свяжитесь с офисом WISE для консультации', 'primary'),
    mkStep('Поддерживайте связь с офисом в процессе выполнения', 'vital'),
    mkStep('Проводите инспекции — смотрите своими глазами', 'vital'),
    mkStep('УСЛОВНАЯ: Если нет ответственного — назначьте одного из руководителей', 'conditional'),
    mkStep('УСЛОВНАЯ: Если завязли — применяйте технологию дебага', 'conditional'),
    mkStep('Составьте список из 20 людей для приглашения', 'operating'),
    mkStep('Подготовьте маршрут экскурсии по офису', 'operating'),
    mkStep('Оформите выставку в приёмной', 'operating'),
    mkStep('Подготовьте раздаточные материалы', 'operating'),
    mkStep('Каждую неделю писать письма 5 людям из списка', 'operating'),
    mkStep('Проводить не менее 5 экскурсий в неделю', 'production'),
    mkStep('Заключить 50 контрактов к концу месяца', 'production'),
  ];

  s.programs = [p1];
  return s;
}

export function buildTIPTemplate(): AdminScale {
  const s = emptyScale('ТИПы сотрудников');
  s.goal = 'Каждый сотрудник имеет чёткую индивидуальную программу развития и повышения продуктивности';
  s.purpose = 'Составить технические индивидуальные программы (ТИП) для всех сотрудников';
  s.policy = 'ТИП составляется на основе инспекции и диагностики. Каждая программа персональна.';
  s.plan = 'Провести диагностику каждого сотрудника, составить ТИП, отслеживать выполнение';
  s.ideal = 'Все сотрудники растут в продуктивности, каждый знает свой план действий';
  s.stats = 'Количество составленных ТИПов, процент выполнения программ, рост статистик сотрудников';
  s.vfp = 'Персональная программа развития для каждого сотрудника с измеримым результатом';

  const p1 = emptyProgram(1);
  p1.name = 'Разработка системы ТИП';
  p1.mainTask = 'Создать и внедрить систему технических индивидуальных программ для всех сотрудников';
  p1.steps = [
    mkStep('Изучить технологию составления ТИП', 'primary'),
    mkStep('Назначить ответственного за программу ТИП', 'primary'),
    mkStep('Собрать статистики всех сотрудников', 'primary'),
    mkStep('Поддерживать регулярный контроль выполнения', 'vital'),
    mkStep('Проводить еженедельные инспекции прогресса', 'vital'),
    mkStep('УСЛОВНАЯ: Если сотрудник не выполняет ТИП — провести этику', 'conditional'),
    mkStep('УСЛОВНАЯ: Если статистики не растут — пересмотреть программу', 'conditional'),
    mkStep('Провести диагностику каждого сотрудника', 'operating'),
    mkStep('Составить индивидуальную программу для каждого', 'operating'),
    mkStep('Выдать ТИП сотрудникам и провести разъяснение', 'operating'),
    mkStep('Составить не менее 5 ТИПов в неделю', 'production'),
    mkStep('Обеспечить 80% выполнение ТИПов', 'production'),
  ];

  s.programs = [p1];
  return s;
}
