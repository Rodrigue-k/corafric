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
  text TEXT NOT NULL UNIQUE,
  translation_fr TEXT,
  language TEXT NOT NULL DEFAULT 'ewe',
  source TEXT DEFAULT 'system',
  recording_status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations pour la table sentences
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS translation_fr TEXT;
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_sentences_status ON sentences(recording_status);
CREATE INDEX IF NOT EXISTS idx_sentences_active_lang ON sentences(is_active, language);

-- Table des enregistrements audio
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  word_id UUID REFERENCES dictionary_words(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  duration_ms INTEGER,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'pending',
  validation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration pour lier les enregistrements aux mots du dictionnaire & autoriser user_id NULL pour contributeurs invités
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS word_id UUID REFERENCES dictionary_words(id) ON DELETE CASCADE;
ALTER TABLE recordings ALTER COLUMN sentence_id DROP NOT NULL;
ALTER TABLE recordings ALTER COLUMN user_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recording_id, user_id)
);

-- Seed sentences in Ewe with French translation (we can append translations in comments or store standard phrases)
INSERT INTO sentences (text, translation_fr, language, source) VALUES
('Ndi na wò.', 'Bonjour (matin)', 'ewe', 'system'),
('Efoa? — Ẽ, mefo.', 'Comment vas-tu ? — Oui, je vais bien.', 'ewe', 'system'),
('Akpe kaka na mi katã.', 'Merci beaucoup à vous tous.', 'ewe', 'system'),
('Mia dogo le ŋkeke siwo gbɔna me.', 'À bientôt dans les prochains jours.', 'ewe', 'system'),
('Eapɔ tsi noa?', 'Veux-tu boire de l''eau ?', 'ewe', 'system'),
('Fia mɔm kple taflatse.', 'Montre-moi le chemin s''il te plaît.', 'ewe', 'system'),
('Nuɖuɖu le anyi na wò.', 'Le repas est prêt pour toi.', 'ewe', 'system'),
('Afikae wòtso?', 'D''où viens-tu ?', 'ewe', 'system'),
('Me lɔ̃ wò vevie.', 'Je t''aime beaucoup.', 'ewe', 'system'),
('Dɔdɔ le ku dzi.', 'Le travail continue.', 'ewe', 'system')
ON CONFLICT (text) DO NOTHING;

-- Table du dictionnaire (Éwé, Français, Anglais) avec croisement de sources
CREATE TABLE IF NOT EXISTS dictionary_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_ewe TEXT NOT NULL UNIQUE,
  word_fr TEXT,
  word_en TEXT,
  definition TEXT,
  audio_url TEXT,
  sources JSONB DEFAULT '[]'::jsonb, -- Liste des sources ayant validé (ex: ["google", "wiktionary"])
  confidence_score INTEGER DEFAULT 0, -- Niveau de fiabilité (augmente avec le croisement)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MIGRATIONS : Système de qualité audio v2
-- =====================================================

-- Remplace le vote booléen par un score 1–5 sur validations
ALTER TABLE validations ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score BETWEEN 1 AND 5);

-- Score moyen calculé sur l'ensemble des votes reçus
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS average_score FLOAT DEFAULT 0;

-- Nombre de votes négatifs (score <= 2) reçus
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS rejected_count INTEGER DEFAULT 0;

-- Marque si cet audio est le meilleur validé pour son mot
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS is_best_for_word BOOLEAN DEFAULT FALSE;

-- Index pour accélérer la recherche du meilleur audio par mot
CREATE INDEX IF NOT EXISTS idx_recordings_best_word ON recordings(word_id, is_best_for_word) WHERE word_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_avg_score ON recordings(average_score DESC) WHERE status = 'approved';


