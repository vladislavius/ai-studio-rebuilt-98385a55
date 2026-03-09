
-- Insert statistic definitions for subdivision div19
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, calculation_method, purpose)
SELECT 'Маржинальная прибыль от реализации туристических услуг',
  'Из суммы выручки за неделю вычитается себестоимость услуг. Формула: Выручка - (Прямые затраты + Переменные расходы). Целевой показатель: Не менее 35% от выручки.',
  'department', id,
  'Выручка - (Прямые затраты + Переменные расходы)', 'ГСД'
FROM departments WHERE code = 'div19';

-- Insert statistic definitions for subdivision div20
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, calculation_method, purpose)
SELECT 'Баллы по контрольному списку отдела 20',
  'Количество решённых пунктов по вопросам лицензирования, миграции, налогообложения, юридическим аспектам.',
  'department', id,
  'Подсчёт решённых пунктов контрольного списка', 'ГСД'
FROM departments WHERE code = 'div20';

INSERT INTO statistic_definitions (title, description, owner_type, owner_id, calculation_method, purpose)
SELECT 'Пункты контрольного списка службы безопасности',
  'Контрольный список по безопасности и охране.',
  'department', id,
  'Подсчёт выполненных пунктов контрольного списка безопасности', 'ГСД'
FROM departments WHERE code = 'div20';

-- Insert statistic definitions for subdivision div21
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, calculation_method, purpose)
SELECT 'Количество поддерживаемых стратегических партнерств',
  'Число действующих стратегических партнерств, способствующих росту клиентской базы, выручки или повышению репутации.',
  'department', id,
  'Подсчёт действующих стратегических партнёрств', 'ГСД'
FROM departments WHERE code = 'div21';

INSERT INTO statistic_definitions (title, description, owner_type, owner_id, calculation_method, purpose)
SELECT 'Баллы по выполнению стратегической программы развития',
  'Оценка прогресса по стратегическим программам развития компании.',
  'department', id,
  'Подсчёт баллов по выполнению этапов стратегической программы', 'ГСД'
FROM departments WHERE code = 'div21';
