-- init.sql
-- database init file

-- USERS: dati di esempio
INSERT INTO users (username, password_hash, role)
VALUES
('test', '$2a$10$zasBP.zYFEKfLbGkdP.WlOiT2qPyvh8Nq2X3O8l158cHKvdfhOu9W', 'user'),
('admin', '$2a$10$zasBP.zYFEKfLbGkdP.WlOiT2qPyvh8Nq2X3O8l158cHKvdfhOu9W', 'admin');
-- "password" + 10 salt rounds -> $2a$10$zasBP.zYFEKfLbGkdP.WlOiT2qPyvh8Nq2X3O8l158cHKvdfhOu9W

-- ROOMS: dati di esempio
INSERT INTO rooms (name, location, capacity)
VALUES
('Aula Gaming 1', 'Piano 1', 10),
('Aula Gaming 2', 'Piano 1', 8),
('Aula Riunioni 1', 'Piano 1', 20),
('Aula Riunioni 2', 'Piano 1', 50),
('Sala Riunioni', 'Piano 2', 20);

-- READERS: dati di esempio
INSERT INTO readers (room_id, reader_uid, public_key)
VALUES
(1, 'READER001', 
'-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArrJtdSCDi/rl5c7gfQra
oW8NjScSEoqj8VfwvPD9aSZuYMh3trNFBRt+3OCksJXRakohoHZGFx3L+ThtXMmD
n/mioSbfn5yBuAR9mSdHTIIDna1qZfEgRdpSPrAgd61ekuJ6EsseKKbz6et+bE1u
kFuCU2lUNn5CULEqIFS2eYKxpzdPKOzw+VxWjH5K8nAUUn8CIbageFKEOoOFg6eo
hmpcq3AqDnEVVErKuQ/PvQaDgtdgWEjmWTuK5WG9aqTceTvtSvz6OhHTLfOVkHiy
L1/DaAJvHrB68tEXlUAAHnrCZJ9Se/MgYQknkcO/ixN7QOrFCE1CZRS8RJepJAbS
LwIDAQAB
-----END PUBLIC KEY-----
'
),
(2, 'READER002', 'FAKE_PUBLIC_KEY_002'),
(3, 'READER003', 'FAKE_PUBLIC_KEY_003'),
(4, 'READER004', 'FAKE_PUBLIC_KEY_004'),
(5, 'READER005', 'FAKE_PUBLIC_KEY_005');

-- CARDS: dati di esempio
INSERT INTO cards (user_id, card_uid)
VALUES
(1, 'CARD-TEST-001'),
(3, 'CARD-ADMIN-001');

-- BOOKINGS: dati di esempio
INSERT INTO bookings (user_id, room_id, start_time, end_time)
VALUES
(1, 1, '2026-01-20 14:00:00', '2026-01-20 16:00:00'),
(1, 2, '2026-01-21 10:00:00', '2026-01-21 12:00:00'),
(1, 3, '2026-01-22 09:00:00', '2026-01-22 11:00:00');

-- ACCESS LOGS: dati di esempio
INSERT INTO access_logs (card_id, reader_id, access_granted, message)
VALUES
(1, 1, TRUE, 'Accesso consentito: Prenotazione valida'),
(1, 2, FALSE, 'Accesso negato: Nessuna prenotazione'),
(2, 3, TRUE, 'Accesso admin – Override');

