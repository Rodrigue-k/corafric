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
  language: string;
  source: string;
  is_active: boolean;
  created_at: Date;
}

export interface Recording {
  id: string;
  sentence_id: string;
  user_id: string;
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

export interface GlobalStats {
  totalRecordings: number;
  approvedRecordings: number;
  totalUsers: number;
  totalHours: number;
  totalSentences: number;
}
