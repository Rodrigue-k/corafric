export interface User {
  id: string;
  username: string;
  country: string | null;
  native_language: string;
  total_contributions: number;
  total_validations: number;
  created_at: Date;
}

export interface Sentence {
  id: string;
  text: string;
  translation_fr?: string | null;
  language: string;
  source: string;
  recording_status?: "pending" | "recorded" | "validated";
  is_active: boolean;
  created_at: Date;
}

export interface DictionaryWord {
  id: string;
  word_ewe: string;
  word_fr: string | null;
  word_en: string | null;
  definition: string | null;
}

export interface Recording {
  id: string;
  sentence_id: string | null;
  word_id: string | null;
  user_id: string | null;
  audio_url: string;
  duration_ms: number | null;
  file_size_bytes: number | null;
  status: "pending" | "approved" | "rejected";
  validation_count: number;
  created_at: Date;
}

export interface Validation {
  id: string;
  recording_id: string;
  user_id: string;
  is_valid: boolean;
  created_at: Date;
}

export interface LeaderboardEntry {
  username: string;
  total_contributions: number;
  total_validations: number;
  country?: string | null;
  rank?: number;
}

export interface GlobalStats {
  totalRecordings: number;
  approvedRecordings: number;
  totalUsers: number;
  totalHours: number;
  totalSentences: number;
  goalRecordings?: number;
  leaderboard?: LeaderboardEntry[];
}

