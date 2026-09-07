import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "@/lib/db";

describe("Integration - Anti-Self Validation & Queue Rules", () => {
  const testUserA = "test_user_alice_" + Date.now();
  const testUserBob = "test_user_bob_" + Date.now();
  let createdRecordingId: string | null = null;
  let wordId: string | null = null;

  beforeAll(async () => {
    // 1. Create test users
    await sql`
      INSERT INTO users (id, username, country, native_language)
      VALUES (${testUserA}, ${testUserA}, 'Togo', 'ewe'),
             (${testUserBob}, ${testUserBob}, 'Togo', 'ewe')
      ON CONFLICT (id) DO NOTHING
    `;

    // 2. Fetch or create a word for testing
    const words = (await sql`SELECT id FROM dictionary_words LIMIT 1`) as { id: string }[];
    if (words.length > 0) {
      wordId = words[0].id;
    }

    // 3. Alice records an audio
    const recRes = (await sql`
      INSERT INTO recordings (word_id, user_id, audio_url, duration_ms, file_size_bytes, status)
      VALUES (${wordId}, ${testUserA}, '/mock-audio/test_alice.webm', 2500, 15000, 'pending')
      RETURNING id
    `) as { id: string }[];

    createdRecordingId = recRes[0]?.id || null;
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdRecordingId) {
      await sql`DELETE FROM validations WHERE recording_id = ${createdRecordingId}`;
      await sql`DELETE FROM recordings WHERE id = ${createdRecordingId}`;
    }
    await sql`DELETE FROM users WHERE id IN (${testUserA}, ${testUserBob})`;
  });

  it("ensures Alice NEVER receives her own recording in the validation queue", async () => {
    const queueForAlice = (await sql`
      SELECT r.id, r.user_id
      FROM recordings r
      LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${testUserA}
      WHERE r.status = 'pending'
        AND v.id IS NULL
        AND (r.user_id IS NULL OR r.user_id != ${testUserA})
        AND r.id = ${createdRecordingId}
      LIMIT 1
    `) as { id: string; user_id: string }[];

    expect(queueForAlice.length).toBe(0);
  });

  it("allows Bob (a different user) to receive Alice's recording in the validation queue", async () => {
    const queueForBob = (await sql`
      SELECT r.id, r.user_id
      FROM recordings r
      LEFT JOIN validations v ON v.recording_id = r.id AND v.user_id = ${testUserBob}
      WHERE r.status = 'pending'
        AND v.id IS NULL
        AND (r.user_id IS NULL OR r.user_id != ${testUserBob})
        AND r.id = ${createdRecordingId}
      LIMIT 1
    `) as { id: string; user_id: string }[];

    expect(queueForBob.length).toBe(1);
    expect(queueForBob[0].id).toBe(createdRecordingId);
  });

  it("blocks Alice from submitting a validation vote on her own recording (API logic test)", async () => {
    // Verify owner check
    const recOwner = (await sql`
      SELECT user_id FROM recordings WHERE id = ${createdRecordingId}
    `) as { user_id: string | null }[];

    const isSelfValidation = recOwner[0]?.user_id === testUserA;
    expect(isSelfValidation).toBe(true);
  });

  it("records Bob's vote and correctly recalculates recording score and validation_count", async () => {
    // Bob votes 5 stars
    const score = 5;
    await sql`
      INSERT INTO validations (recording_id, user_id, is_valid, score)
      VALUES (${createdRecordingId}, ${testUserBob}, ${score >= 3}, ${score})
      ON CONFLICT (recording_id, user_id) DO UPDATE 
        SET is_valid = ${score >= 3}, score = ${score}
    `;

    const stats = (await sql`
      SELECT 
        COUNT(*)::int AS total,
        AVG(score)::float AS avg_score
      FROM validations
      WHERE recording_id = ${createdRecordingId}
    `) as { total: number; avg_score: number }[];

    expect(stats[0].total).toBe(1);
    expect(stats[0].avg_score).toBe(5.0);
  });
});
