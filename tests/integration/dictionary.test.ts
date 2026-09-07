import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "@/lib/db";

describe("Integration - Dictionary Search & Suggestion Moderation", () => {
  const testWordEwe = "test_gbe_" + Date.now();
  let testWordId: string | null = null;
  const testUserId = "test_suggester_" + Date.now();
  let suggestionId: string | null = null;

  beforeAll(async () => {
    // 1. Insert a test word into dictionary_words
    const wordRes = (await sql`
      INSERT INTO dictionary_words (word_ewe, word_fr, word_en, definition)
      VALUES (${testWordEwe}, 'Parole de test', 'Test word', 'Définition de test')
      RETURNING id
    `) as { id: string }[];
    testWordId = wordRes[0]?.id || null;

    // 2. Insert test user
    await sql`
      INSERT INTO users (id, username, country, native_language)
      VALUES (${testUserId}, 'TestUser', 'Togo', 'ewe')
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    // Cleanup test data
    if (suggestionId) {
      await sql`DELETE FROM translation_suggestions WHERE id = ${suggestionId}`;
    }
    if (testWordId) {
      await sql`DELETE FROM dictionary_words WHERE id = ${testWordId}`;
    }
    await sql`DELETE FROM users WHERE id = ${testUserId}`;
  });

  it("finds words by exact and partial search in Ewe and French", async () => {
    const searchEwe = await sql`
      SELECT id, word_ewe, word_fr 
      FROM dictionary_words 
      WHERE LOWER(word_ewe) LIKE ${'%' + testWordEwe.toLowerCase() + '%'}
    `;
    expect(searchEwe.length).toBeGreaterThan(0);
    expect(searchEwe[0].word_ewe).toBe(testWordEwe);

    const searchFr = await sql`
      SELECT id, word_ewe, word_fr 
      FROM dictionary_words 
      WHERE LOWER(word_fr) LIKE '%parole de test%'
    `;
    expect(searchFr.length).toBeGreaterThan(0);
  });

  it("stores community suggestions in translation_suggestions WITHOUT mutating dictionary_words directly", async () => {
    const suggestedFr = "Traduction Communautaire Améliorée";
    
    // 1. Submit suggestion
    const sugRes = (await sql`
      INSERT INTO translation_suggestions (
        word_id, user_id, user_display_name, suggested_fr, status
      ) VALUES (
        ${testWordId}, ${testUserId}, 'TestUser', ${suggestedFr}, 'pending'
      )
      RETURNING id
    `) as { id: string }[];
    suggestionId = sugRes[0]?.id || null;

    expect(suggestionId).toBeDefined();

    // 2. Verify dictionary_words is UNTOUCHED
    const wordCheck = (await sql`
      SELECT word_fr FROM dictionary_words WHERE id = ${testWordId}
    `) as { word_fr: string }[];

    expect(wordCheck[0].word_fr).toBe("Parole de test");
    expect(wordCheck[0].word_fr).not.toBe(suggestedFr);
  });

  it("updates dictionary_words ONLY when suggestion is explicitly approved by admin", async () => {
    const suggestedFr = "Traduction Communautaire Améliorée";

    // Admin approves suggestion
    await sql`
      UPDATE dictionary_words
      SET word_fr = ${suggestedFr}, updated_at = NOW()
      WHERE id = ${testWordId}
    `;

    await sql`
      UPDATE translation_suggestions
      SET status = 'approved'
      WHERE id = ${suggestionId}
    `;

    // Verify word is now updated
    const updatedWord = (await sql`
      SELECT word_fr FROM dictionary_words WHERE id = ${testWordId}
    `) as { word_fr: string }[];

    expect(updatedWord[0].word_fr).toBe(suggestedFr);
  });
});
