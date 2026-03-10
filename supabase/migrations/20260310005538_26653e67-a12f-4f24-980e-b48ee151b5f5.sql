
-- Delete existing stats and values to rebuild
DELETE FROM statistic_values;
DELETE FROM statistic_definitions;

-- DEPT 7 — АДМИНИСТРАТИВНЫЙ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ПО ЮР. ВОПРОСАМ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('ВАЛОВАЯ ВЫРУЧКА КОМПАНИИ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('ВАЛОВАЯ ВЫРУЧКА ОТ ПРОДАЖ ТУРОВ/УСЛУГ', 'Общая сумма денег в кассе.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('ЗАВЕРШЕННЫЕ ЗАДАЧИ ПО СТРАТЕГИИ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('КОЛ-ВО СТРАТЕГИЧЕСКИХ ПАРТНЕРОВ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('КОЛИЧЕСТВО ЗАВЕРШЁННЫХ ЗАДАЧ ПО ПРОГРАММАМ', 'Общее количество стратегических задач.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('МАРЖИНАЛЬНАЯ ПРИБЫЛЬ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('СООТНОШЕНИЕ РЕЗЕРВЫ / СЧЕТА (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('СООТНОШЕНИЕ «РЕЗЕРВЫ / СЧЕТА К ОПЛАТЕ»', 'Ключевой показатель платежеспособности.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', true, false),
('КОЛИЧЕСТВО СОВЕЩАНИЙ КОМИТЕТА', 'Вспомогательная статистика деятельности.', 'department', '49907c3c-12b0-46e2-9829-f2d371666963', false, false);

-- DIV 19
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ИНДЕКС ЖИЗНЕСПОСОБНОСТИ', 'Вспомогательная статистика деятельности.', 'department', '97b83594-224d-49b4-b62e-a9fa9e1775c0', false, false),
('МАРЖИНАЛЬНАЯ ПРИБЫЛЬ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '97b83594-224d-49b4-b62e-a9fa9e1775c0', true, false),
('МАРЖИНАЛЬНАЯ ПРИБЫЛЬ ОТ РЕАЛИЗАЦИИ УСЛУГ', 'Чистая прибыль после расходов.', 'department', '97b83594-224d-49b4-b62e-a9fa9e1775c0', false, false);

-- DIV 20
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ПО КОНТРОЛЬНОМУ СПИСКУ ОТДЕЛА 20', 'Соблюдение юридических норм.', 'department', '1c482731-7b45-4229-83a5-29cf383a2560', false, false),
('БАЛЛЫ ПО ЮР. ВОПРОСАМ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '1c482731-7b45-4229-83a5-29cf383a2560', true, false),
('ПУНКТЫ КОНТРОЛЬНОГО СПИСКА СЛУЖБЫ БЕЗОПАСНОСТИ', 'Проверка безопасности.', 'department', '1c482731-7b45-4229-83a5-29cf383a2560', false, false),
('ПУНКТЫ ЧЕК-ЛИСТА БЕЗОПАСНОСТИ', 'Вспомогательная статистика деятельности.', 'department', '1c482731-7b45-4229-83a5-29cf383a2560', false, false);

-- DIV 21
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ПО ВЫПОЛНЕНИЮ СТРАТЕГИЧЕСКОЙ ПРОГРАММЫ', 'Оценка прогресса движения.', 'department', '3947132d-ed85-4c45-a0b8-3b9ca1d18ba8', false, false),
('КОЛ-ВО СТРАТЕГИЧЕСКИХ ПАРТНЕРОВ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '3947132d-ed85-4c45-a0b8-3b9ca1d18ba8', true, false),
('КОЛИЧЕСТВО ПОДДЕРЖИВАЕМЫХ СТРАТЕГИЧЕСКИХ ПАРТНЁРСТВ', 'Число активных договоров.', 'department', '3947132d-ed85-4c45-a0b8-3b9ca1d18ba8', false, false),
('РОСТ СТОИМОСТИ АКТИВОВ', 'Вспомогательная статистика деятельности.', 'department', '3947132d-ed85-4c45-a0b8-3b9ca1d18ba8', false, false);

-- DEPT 1 — ПОСТРОЕНИЯ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ПО ИНСПЕКЦИЯМ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('БЕСПЕРЕБОЙНОСТЬ СИСТЕМ IT (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('ЗАВЕРШЕННЫЕ ОТЧЁТЫ ОБ ИСПОЛНЕНИИ', 'Количество сданных докладов.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('КОЛ-ВО СОТРУДНИКОВ С РАСТУЩИМИ СТАТАМИ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('КОЛ-ВО ШТАТНЫХ СОТРУДНИКОВ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('КОЛИЧЕСТВО СОТРУДНИКОВ С РАСТУЩИМИ ПОКАЗАТЕЛЯМИ', 'Число сотрудников в нормальном состоянии.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('НОВЫЕ ВВЕДЕННЫЕ В ДОЛЖНОСТЬ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('ОБНАРУЖЕННЫЕ/УЛАЖЕННЫЕ ЭТИКИ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('ПРОЦЕНТ ПЕРСОНАЛА НА ПОСТАХ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, false),
('ЭТИЧЕСКИЕ СИТУАЦИИ', 'Количество этических нарушений сотрудников.', 'department', 'd818a6bd-6763-4f36-a5c7-fd171ffc8795', true, true);

-- DIV 1 — Найма
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ДОЛЖНОСТНЫЕ ИНСТРУКЦИИ', 'Баллы по созданию должностных инструкций.', 'department', '45816552-fccb-427d-929d-41a2dddc6fd5', false, false),
('БАЛЛЫ ЗА СОЗДАНИЕ ДОЛЖНОСТНЫХ ИНСТРУКЦИЙ', 'Документирование.', 'department', '45816552-fccb-427d-929d-41a2dddc6fd5', false, false),
('БАЛЛЫ ПО КАДРОВОМУ УЧЕТУ', 'Система приёма кадров.', 'department', '45816552-fccb-427d-929d-41a2dddc6fd5', false, false),
('НОВЫЕ ВВЕДЕННЫЕ В ДОЛЖНОСТЬ (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '45816552-fccb-427d-929d-41a2dddc6fd5', true, false);

-- DIV 2 — Коммуникации
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА БЕСПЕРЕБОЙНУЮ РАБОТУ СИСТЕМ', 'Стабильность коммуникаций.', 'department', '4fdbab2f-0da0-4627-8844-e3d8365b4774', false, false),
('БЕСПЕРЕБОЙНОСТЬ СИСТЕМ IT (ГСД)', 'Ключевой показатель эффективности подразделения.', 'department', '4fdbab2f-0da0-4627-8844-e3d8365b4774', true, false),
('КОЛ-ВО ВНУТРЕННИХ СООБЩЕНИЙ', 'Вспомогательная статистика.', 'department', '4fdbab2f-0da0-4627-8844-e3d8365b4774', false, false),
('ОБРАБОТАННЫЕ ЗАПРОСЫ В СЛУЖБУ ПОДДЕРЖКИ', 'Обработка запросов.', 'department', '4fdbab2f-0da0-4627-8844-e3d8365b4774', false, false);

-- DIV 3 — Эффективности
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ПО ИНСПЕКЦИЯМ (ГСД)', 'Ключевой показатель.', 'department', '79b949ee-2293-4392-bf74-52c5e5159076', true, false),
('ЗАВЕРШЕННЫЕ ДОКЛАДЫ ОБ ИСПОЛНЕНИИ', 'Вспомогательная.', 'department', '79b949ee-2293-4392-bf74-52c5e5159076', false, false),
('ЗАВЕРШЕННЫЕ ОТЧЁТЫ ОБ ИСПОЛНЕНИИ', 'Вспомогательная.', 'department', '79b949ee-2293-4392-bf74-52c5e5159076', false, false),
('КОЛИЧЕСТВО ПЕРСОНАЛА С РАСТУЩИМИ ПОКАЗАТЕЛЯМИ', 'Вспомогательная.', 'department', '79b949ee-2293-4392-bf74-52c5e5159076', false, false),
('ЭТИЧЕСКИЕ СИТУАЦИИ', 'Статистика обратная.', 'department', '79b949ee-2293-4392-bf74-52c5e5159076', false, true);

-- DEPT 2 — КОММЕРЧЕСКИЙ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КОЛ-ВО НОВЫХ КЛИЕНТОВ (ГСД)', 'Ключевой показатель.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('КОЛИЧЕСТВО ДЕЛОПРОИЗВОДСТВЕННЫХ ПРОДАЖ', 'Завершённые сделки.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('КОНВЕРСИЯ ОТДЕЛА (ГСД)', 'Ключевой показатель.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('КОНВЕРСИЯ ИЗ СПИСКА КЛИЕНТ-ПРОДАЖА', 'Эффективность воронки.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('ОБЩИЙ ВАЛОВЫЙ ДОХОД (ГСД)', 'Вспомогательная статистика.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('ОБЪЕМ ПРОДАЖ ТУРОВ/УСЛУГ', 'Проданные туры/услуги.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false),
('ПЛАНИРУЕМАЯ МАРЖИНАЛЬНАЯ ПРИБЫЛЬ', 'Прогнозирование.', 'department', '1a66d969-2080-4bf7-ac1b-036bcf8ebdb0', true, false);

-- DIV 4 — Маркетинг
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ОХВАТ АУДИТОРИИ', 'Медийная активность.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('КОЛИЧЕСТВО ПРОВЕДЁННЫХ ПРЕЗЕНТАЦИЙ', 'Число активных контактов.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('КОЛ-ВО ИСПОЛЬЗОВАННЫХ МАРКЕТИНГОВЫХ МАТЕРИАЛОВ', 'Маркетинг-микс.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('БАЛЛЫ РАССМОТРЕННЫХ КЛИЕНТОВ', 'Вспомогательный.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('ВОЗМОЖНОСТИ ДЛЯ ПРОДАЖ', 'Объекты для продаж.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('КОЛИЧЕСТВО ЦЕЛЕЙ В БИЗНЕС-ПЛАНЕ', 'Стратегические цели.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', false, false),
('СТОИМОСТЬ ЛИДОВ СРА (ГСД)', 'Ключевой показатель.', 'department', '7b9d9ce1-3ed0-42ef-b9ff-b6ac6a61a0dc', true, false);

-- DIV 5 — Контент
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ПОДБОР КОНТЕНТ', 'Качество контента.', 'department', 'bbe07276-0ef6-4aa5-952f-db3598a64513', false, false),
('КОЛ-ВО КОНСУЛЬТАЦИЙ (ГСД)', 'Ключевой показатель.', 'department', 'bbe07276-0ef6-4aa5-952f-db3598a64513', true, false),
('КОЛ-ВО ОТПРАВЛЕННЫХ ПРЕДЛОЖЕНИЙ (ГСД)', 'Ключевой показатель.', 'department', 'bbe07276-0ef6-4aa5-952f-db3598a64513', true, false),
('КОЛИЧЕСТВО ИНФОРМАЦИОННЫХ МАТЕРИАЛОВ', 'Информационные рассылки.', 'department', 'bbe07276-0ef6-4aa5-952f-db3598a64513', false, false),
('КОЛИЧЕСТВО ТУРИСТОВ С КОНСУЛЬТАЦИЯМИ', 'Обработка обращений.', 'department', 'bbe07276-0ef6-4aa5-952f-db3598a64513', false, false);

-- DIV 6 — Продажи
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КОЛ-ВО ТЕЛЕФОННЫХ ПРОДАЖ (ГСД)', 'Ключевой показатель.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', true, false),
('КОНВЕРСИЯ ИЗ ЛИДА В ПРОДАЖУ', 'Эффективность воронки.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', false, false),
('ЛИЧНЫЕ ОБЪЕМ ПРОДАЖ ГЫД (ГСД)', 'Ключевой показатель.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', true, false),
('ОБЪЕМ ПРОДАЖ ТУРОВ/УСЛУГ', 'Сумма продаж.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', false, false),
('СРЕДНЯЯ ПРИБЫЛЬ ОТ МАРЖИНАЛЬНЫХ СДЕЛОК', 'Средний чек.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', false, false),
('СУММЫ ПРЕДОПЛАТ', 'Авансовые платежи.', 'department', '4eebab57-7131-4b20-bb6f-9b31cfe7be3e', false, false);

-- DEPT 3 — ФИНАНСОВЫЙ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ДЕБИТОРСКАЯ ЗАДОЛЖЕННОСТЬ (ГСД)', 'Ключевой показатель.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, false),
('КОЭФФИЦИЕНТ ЛИКВИДНОСТИ', 'Вспомогательная.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, false),
('ПОСТУПЛЕНИЕ ПЛАТЕЖЕЙ ОТ КЛИЕНТОВ', 'Cash Flow In.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, false),
('ПРОСРОЧЕННАЯ КРЕДИТОРСКАЯ ЗАДОЛЖЕННОСТЬ', 'Долги поставщикам.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, true),
('СУММА АКТИВОВ С УЧЕТОМ ИЗНОСА', 'Имущество компании.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, false),
('СУММА СОБРАННЫХ ДЕНЕГ (ГСД)', 'Ключевой показатель.', 'department', '15425f1a-1b0c-4a93-a1cb-9294bf911ee0', true, false);

-- DIV 7
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ДЕБИТОРСКАЯ ЗАДОЛЖЕННОСТЬ', 'Долги клиентов.', 'department', '2ba42327-2c3a-4d2a-b066-afc0e581cbf7', false, true),
('КОЛ-ВО ВЫСТАВЛЕННЫХ СЧЕТОВ', 'Вспомогательная.', 'department', '2ba42327-2c3a-4d2a-b066-afc0e581cbf7', false, false),
('ПОСТУПЛЕНИЕ ПЛАТЕЖЕЙ ОТ КЛИЕНТОВ', 'Собранная дебиторка.', 'department', '2ba42327-2c3a-4d2a-b066-afc0e581cbf7', false, false),
('СВОЕВРЕМЕННЫЕ ПОСТУПЛЕНИЯ (ГСД)', 'Ключевой показатель.', 'department', '2ba42327-2c3a-4d2a-b066-afc0e581cbf7', true, false);

-- DIV 8
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КРЕДИТОРСКАЯ ЗАДОЛЖЕННОСТЬ', 'Обязательства.', 'department', '1a2b49d0-9148-4b11-b61a-99e94f63573a', false, true),
('КРЕДИТОРСКАЯ ЗАДОЛЖЕННОСТЬ (ГСД)', 'Ключевой показатель.', 'department', '1a2b49d0-9148-4b11-b61a-99e94f63573a', true, false),
('СООТНОШЕНИЕ ВЫРУЧКИ К РАСХОДАМ', 'Рентабельность.', 'department', '1a2b49d0-9148-4b11-b61a-99e94f63573a', false, false),
('СООТНОШЕНИЕ «НАЛИЧНЫЕ/СЧЕТА К ОПЛАТЕ»', 'Ликвидность.', 'department', '1a2b49d0-9148-4b11-b61a-99e94f63573a', false, false),
('СУММА СЭКОНОМЛЕННЫХ СРЕДСТВ', 'Вспомогательная.', 'department', '1a2b49d0-9148-4b11-b61a-99e94f63573a', false, false);

-- DIV 9
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ВЕДЕНИЕ БУХГАЛТЕРСКОГО УЧЁТА', 'Качество учёта.', 'department', '95758486-862b-4518-86ae-54b0bb435d67', false, false),
('КОЛ-ВО ОБРАБОТАННЫХ ФИНАНСОВЫХ ДОКУМЕНТОВ', 'Объём обработки.', 'department', '95758486-862b-4518-86ae-54b0bb435d67', false, false),
('СУММА АКТИВОВ С УЧЕТОМ ИЗНОСА (ГСД)', 'Ключевой показатель.', 'department', '95758486-862b-4518-86ae-54b0bb435d67', true, false);

-- DEPT 4 — ПРОИЗВОДСТВЕННЫЙ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ИНДЕКС ЗАГРУЗКИ РЕСУРСОВ', 'Вспомогательная.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false),
('КОЛ-ВО ДОВОЛЬНЫХ КЛИЕНТОВ (ГСД)', 'Ключевой показатель.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false),
('КОЛИЧЕСТВО ПОЛОЖИТЕЛЬНЫХ ОТЗЫВОВ', 'Отзывы 4-5 звёзд.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false),
('КОЛИЧЕСТВО ПРЕДОСТАВЛЕННЫХ ТУРОВ', 'Фактическое кол-во.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false),
('ОБЩАЯ СТОИМОСТЬ ПРЕДОСТАВЛЕННЫХ УСЛУГ', 'Выполненные показатели.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false),
('ОБЪЕМ ОКАЗАННЫХ УСЛУГ (ГСД)', 'Ключевой показатель.', 'department', '0c00d355-ffbf-4f53-964d-ff91b1953504', true, false);

-- DIV 10
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КОЛИЧЕСТВО ЗАБРОНИРОВАННЫХ ТУРОВ', 'Обработанные заявки.', 'department', 'a269ef26-5238-425c-b48b-17e9d758b4ce', false, false),
('ПОДТВЕРЖДЁННЫЕ БРОНИ (ГСД)', 'Ключевой показатель.', 'department', 'a269ef26-5238-425c-b48b-17e9d758b4ce', true, false),
('ПРОЦЕНТ ОТМЕН БРОНИРОВАНИЯ', 'Вспомогательная.', 'department', 'a269ef26-5238-425c-b48b-17e9d758b4ce', false, true);

-- DIV 11
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КИЛОМЕТРАЖ БЕЗ СБОЕВ', 'Вспомогательная.', 'department', '605d6c5f-08b5-4207-bf6d-032958128448', false, false),
('КОЛИЧЕСТВО УСПЕШНЫХ ТРАНСФЕРОВ', 'Поездки без инцидентов.', 'department', '605d6c5f-08b5-4207-bf6d-032958128448', false, false),
('УСПЕШНЫЕ ТРАНСФЕРЫ (ГСД)', 'Ключевой показатель.', 'department', '605d6c5f-08b5-4207-bf6d-032958128448', true, false);

-- DIV 12
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ТЕХНИЧЕСКОЕ СОСТОЯНИЕ', 'Вспомогательная.', 'department', '006bf609-e656-4064-9faf-1c21592f8d5a', false, false),
('КОЛ-ВО ПРОВЕДЁННЫХ ЭКСКУРСИЙ (ГСД)', 'Ключевой показатель.', 'department', '006bf609-e656-4064-9faf-1c21592f8d5a', true, false),
('ОБЪЕМ ПРЕДОСТАВЛЕННЫХ УСЛУГ', 'Стоимость услуг.', 'department', '006bf609-e656-4064-9faf-1c21592f8d5a', false, false),
('ПРОЦЕНТ ПОЛОЖИТЕЛЬНЫХ ОТЗЫВОВ', 'Доля довольных.', 'department', '006bf609-e656-4064-9faf-1c21592f8d5a', false, false);

-- DEPT 5 — КАЧЕСТВА
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ИНДЕКС NPS (ГСД)', 'Ключевой показатель.', 'department', '6acb1996-90a0-459e-97f7-94503108147e', true, false),
('КОЛ-ВО АТТЕСТОВАННЫХ СОТРУДНИКОВ (ГСД)', 'Ключевой показатель.', 'department', '6acb1996-90a0-459e-97f7-94503108147e', true, false),
('МАРЖИНАЛЬНАЯ ПРИБЫЛЬ НА СОТРУДНИКА', 'Ключевой показатель.', 'department', '6acb1996-90a0-459e-97f7-94503108147e', true, false),
('ПРОЦЕНТ ПРОДУКТА БЕЗ БРАКА (ГСД)', 'Ключевой показатель.', 'department', '6acb1996-90a0-459e-97f7-94503108147e', true, false),
('УСЛУГИ, СООТВЕТСТВУЮЩИЕ СТАНДАРТАМ', 'Проверка ОКК.', 'department', '6acb1996-90a0-459e-97f7-94503108147e', true, false);

-- DIV 13
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('КОЛ-ВО ПРОВЕРОК ОКК (ГСД)', 'Ключевой показатель.', 'department', '801be6a1-be3b-4dbf-af9e-9b39364a2e12', true, false),
('КОЛИЧЕСТВО НЕСООТВЕТСТВИЙ', 'Брак и проблемы.', 'department', '801be6a1-be3b-4dbf-af9e-9b39364a2e12', false, true),
('ОБЪЕМ УСЛУГ 100% КАЧЕСТВА', 'Идеальные услуги.', 'department', '801be6a1-be3b-4dbf-af9e-9b39364a2e12', false, false),
('УЛАЖЕННЫЕ ПРЕТЕНЗИИ', 'Вспомогательная.', 'department', '801be6a1-be3b-4dbf-af9e-9b39364a2e12', false, false);

-- DIV 14
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('БАЛЛЫ ЗА ПРОФ. ПОДГОТОВКУ', 'Вспомогательная.', 'department', 'f5f38161-3b62-4d62-9392-7d696e927733', false, false),
('ЗАВЕРШЕННЫЕ ЗАДАЧИ ПО ПОДГОТОВКЕ', 'Обучение сотрудников.', 'department', 'f5f38161-3b62-4d62-9392-7d696e927733', false, false),
('ЗАВЕРШЕННЫЕ КУРСЫ ОБУЧЕНИЯ (ГСД)', 'Ключевой показатель.', 'department', 'f5f38161-3b62-4d62-9392-7d696e927733', true, false);

-- DIV 15
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ВНЕДРЕННЫЕ УЛУЧШЕНИЯ (ГСД)', 'Ключевой показатель.', 'department', 'fb6f3119-2a38-4645-a758-a3f226c14210', true, false),
('ИСПРАВЛЕННЫЕ ОШИБКИ ПРОЦЕССОВ', 'Вспомогательная.', 'department', 'fb6f3119-2a38-4645-a758-a3f226c14210', false, false),
('ОБНОВЛЁННЫЕ ИНСТРУКЦИИ (ШТ.)', 'Вспомогательная.', 'department', 'fb6f3119-2a38-4645-a758-a3f226c14210', false, false);

-- DEPT 6 — РАСШИРЕНИЯ
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ИНДЕКС УЗНАВАЕМОСТИ БРЕНДА', 'Узнаваемость и охваты.', 'department', 'b7b95c1c-4e64-4617-ab8c-346b76b58571', true, false),
('ИНДЕКС УЗНАВАЕМОСТИ БРЕНДА (ГСД)', 'Ключевой показатель.', 'department', 'b7b95c1c-4e64-4617-ab8c-346b76b58571', true, false),
('КОЛ-ВО НОВЫХ ИМЕН В БАЗЕ (ГСД)', 'Ключевой показатель.', 'department', 'b7b95c1c-4e64-4617-ab8c-346b76b58571', true, false),
('НОВЫЕ ТУРИСТЫ (ИНТЕРЕС)', 'Потенциальный клиентский PI.', 'department', 'b7b95c1c-4e64-4617-ab8c-346b76b58571', true, false);

-- DIV 16
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ИНДЕКС УЗНАВАЕМОСТИ БРЕНДА', 'Медийная активность.', 'department', 'a00bf643-b399-46de-80f6-def9398af14e', false, false),
('ОХВАТ ЦЕЛЕВОЙ АУДИТОРИИ', 'Вспомогательная.', 'department', 'a00bf643-b399-46de-80f6-def9398af14e', false, false),
('УПОМИНАНИЯ В СМИ/БЛОГАХ (ГСД)', 'Ключевой показатель.', 'department', 'a00bf643-b399-46de-80f6-def9398af14e', true, false);

-- DIV 17
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ДОХОД ОТ ВВОДНЫХ УСЛУГ', 'Вспомогательная.', 'department', 'cb00c54f-a0ef-4e9d-a5c8-93784e9d5892', false, false),
('НОВЫЕ ТУРИСТЫ (ВВОДНЫЕ УСЛУГИ)', 'Год-квартала.', 'department', 'cb00c54f-a0ef-4e9d-a5c8-93784e9d5892', false, false),
('ПРОДАНО ВВОДНЫХ УСЛУГ (ГСД)', 'Ключевой показатель.', 'department', 'cb00c54f-a0ef-4e9d-a5c8-93784e9d5892', true, false);

-- DIV 18
INSERT INTO statistic_definitions (title, description, owner_type, owner_id, is_favorite, inverted) VALUES
('ДОХОД ОТ ПАРТНЕРСКОЙ СЕТИ', 'Вспомогательная.', 'department', '9665bb88-5306-436d-bbdf-478bb375d903', false, false),
('КОЛ-ВО АКТИВНЫХ АГЕНТОВ (ГСД)', 'Ключевой показатель.', 'department', '9665bb88-5306-436d-bbdf-478bb375d903', true, false),
('КОЛ-ВО ВСТРЕЧ С ПАРТНЕРАМИ', 'Вспомогательная.', 'department', '9665bb88-5306-436d-bbdf-478bb375d903', false, false),
('НОВЫЕ ЗАКЛЮЧЕННЫЕ ДОГОВОРА', 'Вспомогательная.', 'department', '9665bb88-5306-436d-bbdf-478bb375d903', false, false),
('НОВЫЕ ТУРИСТЫ ОТ ПАРТНЁРОВ', 'Рекомендационный поток.', 'department', '9665bb88-5306-436d-bbdf-478bb375d903', false, false);

-- Seed 12 weeks of sample values for all stats
INSERT INTO statistic_values (definition_id, date, value, value2)
SELECT
  sd.id,
  (CURRENT_DATE - (w * 7 * INTERVAL '1 day'))::date,
  CASE
    WHEN sd.title ILIKE '%выручк%' OR sd.title ILIKE '%доход%' OR sd.title ILIKE '%стоимост%' OR sd.title ILIKE '%прибыл%' OR sd.title ILIKE '%задолженност%' OR sd.title ILIKE '%актив%' OR sd.title ILIKE '%поступлен%' OR sd.title ILIKE '%объем%' OR sd.title ILIKE '%сумм%'
      THEN FLOOR(400000 + RANDOM() * 2200000)
    WHEN sd.title ILIKE '%процент%' OR sd.title ILIKE '%индекс%' OR sd.title ILIKE '%конверси%' OR sd.title ILIKE '%коэффициент%' OR sd.title ILIKE '%соотношен%'
      THEN FLOOR(15 + RANDOM() * 80)
    ELSE FLOOR(20 + RANDOM() * 130)
  END,
  CASE
    WHEN sd.title ILIKE '%выручк%' OR sd.title ILIKE '%доход%' OR sd.title ILIKE '%стоимост%' OR sd.title ILIKE '%прибыл%' OR sd.title ILIKE '%задолженност%' OR sd.title ILIKE '%сумм%'
      THEN FLOOR(500000 + RANDOM() * 2000000)
    WHEN sd.title ILIKE '%процент%' OR sd.title ILIKE '%индекс%' OR sd.title ILIKE '%конверси%'
      THEN FLOOR(20 + RANDOM() * 70)
    ELSE FLOOR(25 + RANDOM() * 120)
  END
FROM statistic_definitions sd
CROSS JOIN generate_series(0, 11) AS w;
