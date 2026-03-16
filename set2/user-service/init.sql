CREATE TABLE IF NOT EXISTS user_profiles (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER UNIQUE NOT NULL,
  username     VARCHAR(50),
  email        VARCHAR(100),
  role         VARCHAR(20) DEFAULT 'member',
  display_name VARCHAR(100),
  bio          TEXT,
  avatar_url   VARCHAR(255),
  updated_at   TIMESTAMP DEFAULT NOW()
);

INSERT INTO user_profiles (user_id,username,email,role) VALUES 
(1,'admin','admin@lab.local','admin'),
(2, 'Alice Smith', 'alice@example.com', 'member'),
(3, 'Bob Jones',   'bob@example.com',   'member'),
(4, 'admin2', 'admin2@example.com', 'admin')
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  level      VARCHAR(10) NOT NULL,
  event      VARCHAR(100) NOT NULL,
  user_id    INTEGER,
  message    TEXT,
  meta       JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);