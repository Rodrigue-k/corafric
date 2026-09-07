import { describe, it, expect } from 'vitest';
import { sql } from '@/lib/db';

describe('Database Concurrency and Pool Stress Test', () => {
  it('handles 50 concurrent dictionary lookups without connection exhaustion', async () => {
    const concurrentCount = 50;
    const queries = Array.from({ length: concurrentCount }).map(async (_, idx) => {
      const term = idx % 2 === 0 ? 'a' : 'e';
      const results = await sql`
        SELECT id, word_ewe, word_fr 
        FROM dictionary_words 
        WHERE word_ewe ILIKE ${term + '%'} 
        LIMIT 5
      `;
      return results;
    });

    const results = await Promise.all(queries);
    expect(results.length).toBe(concurrentCount);
    for (const res of results) {
      expect(Array.isArray(res)).toBe(true);
    }
  });

  it('handles concurrent recordings statistics aggregation under load', async () => {
    const concurrentCount = 30;
    const queries = Array.from({ length: concurrentCount }).map(async () => {
      const [stats] = await sql`
        SELECT 
          COUNT(*)::int AS total_recordings,
          COUNT(CASE WHEN status = 'validated' THEN 1 END)::int AS total_validated
        FROM recordings
      `;
      return stats;
    });

    const results = await Promise.all(queries);
    expect(results.length).toBe(concurrentCount);
    for (const res of results) {
      expect(res).toBeDefined();
      expect(typeof (res as any).total_recordings).toBe('number');
    }
  });
});
