CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'member',
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP
);

INSERT INTO users (username,email,password_hash,role) VALUES
('admin','admin@lab.local','$2b$10$f3Aha3p9oVMqXG4Q6DnE7uiI1uxpOopewnVHPjJ.xg9leMm8h8c2S','admin'),
('user-001', 'alice@example.com','$2a$10$aOp3jwB6LvbUSbkz1wJEgu1dmjxoocG8/JmQlc/Nev20.SWH0sQ9K', 'member'),
('user-002', 'bob@example.com','$2a$10$aOp3jwB6LvbUSbkz1wJEgu1dmjxoocG8/JmQlc/Nev20.SWH0sQ9K', 'member'),
('admin2', 'admin2@example.com','$2a$10$aOp3jwB6LvbUSbkz1wJEgu1dmjxoocG8/JmQlc/Nev20.SWH0sQ9K', 'admin');

CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  level      VARCHAR(10)  NOT NULL,
  event      VARCHAR(100) NOT NULL,
  user_id    INTEGER,
  message    TEXT,
  meta       JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);