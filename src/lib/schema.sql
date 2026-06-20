-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  country TEXT,
  native_language TEXT DEFAULT 'ewe',
  total_contributions INTEGER DEFAULT 0,
  total_validations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des phrases
CREATE TABLE IF NOT EXISTS sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ewe',
  source TEXT DEFAULT 'system',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des enregistrements audio
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  audio_url TEXT NOT NULL,
  duration_ms INTEGER,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'pending',
  validation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des validations (votes)
CREATE TABLE IF NOT EXISTS validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recording_id, user_id)
);

-- Seed sentences in Ewe with French translation (we can append translations in comments or store standard phrases)
INSERT INTO sentences (text, language, source) VALUES
('Ndi na wò.', 'ewe', 'system'),
('Efoa? — Ẽ, mefo.', 'ewe', 'system'),
('Akpe kaka na mi katã.', 'ewe', 'system'),
('Mia dogo le ŋkeke siwo gbɔna me.', 'ewe', 'system'),
('Eapɔ tsi noa?', 'ewe', 'system'),
('Fia mɔm kple taflatse.', 'ewe', 'system'),
('Nuɖuɖu le anyi na wò.', 'ewe', 'system'),
('Afikae wòtso?', 'ewe', 'system'),
('Me lɔ̃ wò vevie.', 'ewe', 'system'),
('Dɔdɔ le ku dzi.', 'ewe', 'system')
ON CONFLICT DO NOTHING;
