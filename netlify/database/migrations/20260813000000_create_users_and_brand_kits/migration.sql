CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE brand_kits (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL DEFAULT '',
  agent_phone TEXT NOT NULL DEFAULT '',
  agent_email TEXT NOT NULL DEFAULT '',
  brokerage_name TEXT NOT NULL DEFAULT '',
  brokerage_city TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#E0298C',
  headshot_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
