import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'birthday' | 'checkout_pending' | 'checkout_approved' | 'checkout_rejected';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  daysLeft: number;
}

export function useNotifications() {
  const { data: employees } = useEmployees();
  const { isAdmin, isSupervisor, user } = useAuth();

  // Pending checkouts for supervisors/admins
  const { data: pendingCheckouts } = useQuery({
    queryKey: ['pending-checkouts-notif'],
    queryFn: async () => {
      const { data } = await supabase.from('checkout_requests').select('id').eq('status', 'pending');
      return data ?? [];
    },
    enabled: isAdmin || isSupervisor,
    refetchInterval: 30_000,
  });

  // My employee record (for student checkout results)
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee-notif', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from('employees').select('id').eq('email', user.email).maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  // My recent checkout results (last 7 days, not birthday type)
  const { data: myCheckoutResults } = useQuery({
    queryKey: ['my-checkout-results-notif', myEmployee?.id],
    queryFn: async () => {
      if (!myEmployee?.id) return [];
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('checkout_requests')
        .select('id, status, reviewed_at')
        .eq('employee_id', myEmployee.id)
        .in('status', ['approved', 'rejected'])
        .gte('reviewed_at', since)
        .order('reviewed_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!myEmployee?.id,
    refetchInterval: 60_000,
  });

  const notifications = useMemo<Notification[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: Notification[] = [];

    // Birthday notifications
    for (const emp of employees ?? []) {
      if (!emp.birth_date) continue;
      const bday = new Date(emp.birth_date);
      let bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (bdayThisYear < today) {
        bdayThisYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      }
      const daysLeft = Math.round((bdayThisYear.getTime() - today.getTime()) / 86_400_000);
      if (daysLeft <= 7) {
        result.push({
          id: `bday-${emp.id}`,
          type: 'birthday',
          title: emp.full_name,
          subtitle: daysLeft === 0 ? 'Сегодня день рождения!' : `День рождения через ${daysLeft} ${pluralDays(daysLeft)}`,
          daysLeft,
        });
      }
    }

    // Pending checkouts (for supervisors/admins)
    if (pendingCheckouts && pendingCheckouts.length > 0) {
      result.push({
        id: 'checkout-pending',
        type: 'checkout_pending',
        title: `${pendingCheckouts.length} чек-аут${pendingCheckouts.length > 1 ? 'а' : ''} ожидает проверки`,
        subtitle: 'Перейдите в Академию → Чек-ауты',
        daysLeft: 0,
      });
    }

    // My checkout results (for students)
    for (const co of myCheckoutResults ?? []) {
      result.push({
        id: `checkout-${co.id}`,
        type: co.status === 'approved' ? 'checkout_approved' : 'checkout_rejected',
        title: co.status === 'approved' ? 'Чек-аут пройден ✓' : 'Чек-аут не пройден',
        subtitle: co.status === 'approved' ? 'Поздравляем! Продолжайте курс' : 'Требуется пересдача',
        daysLeft: 0,
      });
    }

    return result.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [employees, pendingCheckouts, myCheckoutResults]);

  return { notifications, count: notifications.length };
}

function pluralDays(n: number) {
  if (n >= 11 && n <= 14) return 'дней';
  const r = n % 10;
  if (r === 1) return 'день';
  if (r >= 2 && r <= 4) return 'дня';
  return 'дней';
}
