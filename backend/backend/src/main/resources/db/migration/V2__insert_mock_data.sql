
CREATE EXTENSION IF NOT EXISTS pgcrypto;

TRUNCATE TABLE app_users, vehicles, drivers, destinations, trips, telematics_data, telemetry_data, telematics_alerts, repairs, analytics_events RESTART IDENTITY CASCADE;

INSERT INTO public.app_users (id, username, password, role) VALUES
                                                                (1, 'Radok', crypt('12345', gen_salt('bf', 10)), 'ROLE_ADMIN'),
                                                                (2, 'Pavel', crypt('12345', gen_salt('bf', 10)), 'ROLE_USER');
SELECT setval('public.app_users_id_seq', 2, true);

INSERT INTO public.vehicles (id, model, plate_number, status, manufacture_year, tank_capacity, fuel_norm, current_fuel_level, last_latitude, last_longitude) VALUES
                                                                                                                                                                 (1, 'Volvo FH16', 'AK-1111-7', 'В ПУТИ', 2021, 600.0, 30.5, 450.0, 53.9006, 27.5590),
                                                                                                                                                                 (2, 'Scania R500', 'AK-2222-7', 'СВОБОДЕН', 2020, 700.0, 29.0, 680.0, 52.0976, 23.7341),
                                                                                                                                                                 (3, 'MAN TGX', 'AK-3333-7', 'В ПУТИ', 2019, 800.0, 31.0, 200.0, 53.6694, 23.8131),
                                                                                                                                                                 (4, 'Mercedes Actros', 'AK-4444-7', 'НА РЕМОНТЕ', 2018, 600.0, 28.5, 150.0, 55.1904, 30.2049),
                                                                                                                                                                 (5, 'DAF XF 480', 'AK-5555-7', 'СВОБОДЕН', 2022, 850.0, 27.8, 800.0, 52.4345, 30.9754),
                                                                                                                                                                 (6, 'Iveco Stralis', 'AK-6666-7', 'В ПУТИ', 2017, 500.0, 32.0, 310.0, 53.8930, 27.5674),
                                                                                                                                                                 (7, 'Renault T High', 'AK-7777-7', 'СВОБОДЕН', 2021, 650.0, 29.5, 600.0, 53.9006, 27.5590),
                                                                                                                                                                 (8, 'Volvo FH 500', 'AK-8888-7', 'НА РЕМОНТЕ', 2016, 600.0, 33.0, 50.0, 55.7558, 37.6173),
                                                                                                                                                                 (9, 'Scania S500', 'AK-9999-7', 'В ПУТИ', 2023, 750.0, 28.0, 700.0, 52.2297, 21.0122),
                                                                                                                                                                 (10, 'MAN TGS', 'AA-1010-7', 'СВОБОДЕН', 2020, 600.0, 30.0, 400.0, 53.9006, 27.5590),
                                                                                                                                                                 (11, 'Mercedes Arocs', 'AA-2020-7', 'В ПУТИ', 2019, 550.0, 34.0, 250.0, 54.7899, 32.0533),
                                                                                                                                                                 (12, 'DAF CF 450', 'AA-3030-7', 'СВОБОДЕН', 2018, 500.0, 29.0, 480.0, 53.9006, 27.5590),
                                                                                                                                                                 (13, 'KAMAZ 54901', 'AA-4040-7', 'В ПУТИ', 2022, 600.0, 31.5, 380.0, 55.7558, 37.6173),
                                                                                                                                                                 (14, 'MAZ 5440', 'AA-5050-7', 'НА РЕМОНТЕ', 2015, 500.0, 35.0, 100.0, 53.9006, 27.5590),
                                                                                                                                                                 (15, 'Volvo FM', 'AA-6060-7', 'СВОБОДЕН', 2020, 650.0, 30.2, 620.0, 52.0976, 23.7341);
SELECT setval('public.vehicles_id_seq', 15, true);

INSERT INTO public.drivers (id, full_name, contact, assigned_vehicle_id) VALUES
                                                                             (1, 'Алексей Смирнов', '+375291111111', 1), (2, 'Борис Иванов', '+375292222222', 2),
                                                                             (3, 'Виктор Петров', '+375293333333', 3), (4, 'Геннадий Сидоров', '+375294444444', 4),
                                                                             (5, 'Дмитрий Соколов', '+375295555555', 5), (6, 'Евгений Попов', '+375296666666', 6),
                                                                             (7, 'Жан Лебедев', '+375297777777', 7), (8, 'Захар Козлов', '+375298888888', 8),
                                                                             (9, 'Илья Новиков', '+375299999999', 9), (10, 'Кирилл Морозов', '+375291010101', 10),
                                                                             (11, 'Леонид Волков', '+375291212121', 11), (12, 'Максим Алексеев', '+375291313131', 12),
                                                                             (13, 'Николай Павлов', '+375291414141', 13), (14, 'Олег Богданов', '+375291515151', 14),
                                                                             (15, 'Павел Шильцев', '+375291616161', 15);
SELECT setval('public.drivers_id_seq', 15, true);

INSERT INTO public.destinations (id, name, latitude, longitude) VALUES
                                                                    (1, 'Минск, Склад 1', 53.9006, 27.5590), (2, 'Брест, Таможня', 52.0976, 23.7341),
                                                                    (3, 'Гродно, База', 53.6694, 23.8131), (4, 'Витебск, Логистика', 55.1904, 30.2049),
                                                                    (5, 'Москва, Центр', 55.7558, 37.6173), (6, 'Варшава, Терминал', 52.2297, 21.0122);
SELECT setval('public.destinations_id_seq', 6, true);

INSERT INTO public.trips (id, vehicle_id, driver_id, trip_date, start_time, end_time, mileage_start, mileage_end, fuel_used, fuel_cost, status) VALUES
                                                                                                                                                    (1, 1, 1, '2026-03-01', '2026-03-01 08:00:00', '2026-03-01 16:00:00', 100000, 100350, 105.00, 210.00, 'COMPLETED'),
                                                                                                                                                    (2, 2, 2, '2026-03-05', '2026-03-05 09:00:00', '2026-03-06 18:00:00', 150000, 150800, 230.00, 460.00, 'COMPLETED'),
                                                                                                                                                    (3, 3, 3, '2026-03-10', '2026-03-10 07:00:00', '2026-03-11 12:00:00', 200000, 200600, 185.00, 370.00, 'COMPLETED'),
                                                                                                                                                    (4, 5, 5, '2026-03-15', '2026-03-15 10:00:00', '2026-03-15 20:00:00', 50000, 50450, 125.00, 250.00, 'COMPLETED'),
                                                                                                                                                    (5, 1, 1, '2026-04-04', '2026-04-04 08:00:00', NULL, 100350, 100500, 45.00, 90.00, 'IN_PROGRESS'),
                                                                                                                                                    (6, 6, 6, '2026-04-03', '2026-04-03 06:00:00', NULL, 300000, 300400, 120.00, 240.00, 'IN_PROGRESS'),
                                                                                                                                                    (7, 9, 9, '2026-04-02', '2026-04-02 12:00:00', NULL, 80000, 80900, 250.00, 500.00, 'IN_PROGRESS');
SELECT setval('public.trips_id_seq', 7, true);

INSERT INTO public.repairs (id, vehicle_id, repair_date, description, cost) VALUES
                                                                                (1, 4, '2026-03-10', 'Замена тормозных колодок', 450.00),
                                                                                (2, 8, '2026-03-15', 'Ремонт двигателя (ТНВД)', 2500.00),
                                                                                (3, 14, '2026-03-20', 'Замена масла и фильтров', 300.00),
                                                                                (4, 1, '2026-02-28', 'Шиномонтаж (2 колеса)', 200.00),
                                                                                (5, 6, '2026-03-05', 'Замена лобового стекла', 600.00);
SELECT setval('public.repairs_id_seq', 5, true);

INSERT INTO public.telematics_alerts (id, vehicle_id, "timestamp", type, description, latitude, longitude, financial_loss) VALUES
                                                                                                                               (1, 1, '2026-03-01 10:15:00', 'OVERSPEED', 'Превышение скорости 110 км/ч', 53.8000, 27.5000, 0.00),
                                                                                                                               (2, 3, '2026-03-10 09:30:00', 'FUEL_DROP', 'Резкое падение уровня топлива (Слив)', 53.6800, 23.8200, 150.00),
                                                                                                                               (3, 4, '2026-03-09 14:00:00', 'ENGINE_ERROR', 'Критическая ошибка двигателя', 55.1904, 30.2049, 200.00),
                                                                                                                               (4, 9, '2026-04-02 18:45:00', 'HARSH_BRAKING', 'Резкое торможение', 52.5000, 22.0000, 0.00),
                                                                                                                               (5, 14, '2026-03-19 11:20:00', 'MAINTENANCE', 'Пропущен интервал ТО', 53.9006, 27.5590, 50.00);
SELECT setval('public.telematics_alerts_id_seq', 5, true);

INSERT INTO public.analytics_events (id, "timestamp", vehicle_id, user_login, event_type, event_name, category, description, parameter) VALUES
                                                                                                                                            (1, '2026-04-04 08:00:00', NULL, 'Radok', 'USER_LOGIN', 'Вход в систему', 'SECURITY', 'Администратор вошел в систему', 'IP: 192.168.1.1'),
                                                                                                                                            (2, '2026-04-04 08:05:00', 1, 'Radok', 'TRIP_START', 'Старт рейса', 'OPERATIONS', 'Рейс #5 начат', 'Mileage: 100350'),
                                                                                                                                            (3, '2026-04-04 09:00:00', NULL, 'Pavel', 'USER_LOGIN', 'Вход в систему', 'SECURITY', 'Менеджер вошел в систему', 'IP: 192.168.1.2'),
                                                                                                                                            (4, '2026-04-04 09:15:00', 3, 'Pavel', 'REPORT_GENERATE', 'Генерация отчета', 'ANALYTICS', 'Сгенерирован отчет по топливу', 'Format: PDF'),
                                                                                                                                            (5, '2026-04-04 10:00:00', 9, 'System', 'ALERT_TRIGGERED', 'Срабатывание триггера', 'TELEMATICS', 'Зафиксировано превышение скорости', 'Speed: 105 km/h');
SELECT setval('public.analytics_events_id_seq', 5, true);

INSERT INTO public.telemetry_data (id, vehicle_id, "timestamp", latitude, longitude, speed, fuel_level) VALUES
                                                                                                            (1, 1, '2026-04-04 08:00:00', 53.9006, 27.5590, 0.0, 495.0),
                                                                                                            (2, 1, '2026-04-04 08:15:00', 53.8500, 27.4500, 65.5, 490.5),
                                                                                                            (3, 1, '2026-04-04 08:30:00', 53.7500, 27.3000, 88.0, 485.2),
                                                                                                            (4, 1, '2026-04-04 08:45:00', 53.6833, 27.1333, 89.5, 480.0),
                                                                                                            (5, 1, '2026-04-04 09:00:00', 53.5500, 26.9000, 87.0, 474.5);
SELECT setval('public.telemetry_data_id_seq', 5, true);