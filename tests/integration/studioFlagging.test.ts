import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "@/lib/db";
import { POST as flagRoute } from "@/app/api/studio/flag/route";

describe("Integration - Studio Sentence Flagging and Setting Aside", () => {
  let testSentenceId: string | null = null;
  const testText = "Eƒe ŋkɔe nye test studio sentence " + Date.now();
  const testTranslation = "Ceci est une phrase de test studio";

  beforeAll(async () => {
    // 1. Create a test sentence
    const res = (await sql`
      INSERT INTO sentences (text, language, translation_fr, is_active, is_flagged, recording_status)
      VALUES (${testText}, 'ewe', ${testTranslation}, TRUE, FALSE, 'pending')
      RETURNING id
    `) as { id: string }[];

    testSentenceId = res[0]?.id || null;
  });

  afterAll(async () => {
    if (testSentenceId) {
      await sql`DELETE FROM flagged_sentences WHERE sentence_id = ${testSentenceId}`;
      await sql`DELETE FROM sentences WHERE id = ${testSentenceId}`;
    }
  });

  it("verifies the test sentence is initially active and unflagged in database", async () => {
    const [sentence] = (await sql`
      SELECT id, text, is_flagged, recording_status FROM sentences WHERE id = ${testSentenceId}
    `) as { id: string; text: string; is_flagged: boolean; recording_status: string }[];

    expect(sentence).toBeDefined();
    expect(sentence.is_flagged).toBe(false);
    expect(sentence.recording_status).toBe("pending");
  });

  it("flags the sentence with a specific reason and puts it aside in flagged_sentences", async () => {
    const req = new Request("http://localhost:3000/api/studio/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentenceId: testSentenceId,
        reason: "bad_translation",
        suggestedFix: "Traduction corrigée par le studio",
        notes: "Test unitaire studio",
        operatorName: "Testeur Studio",
      }),
    });

    const res = await flagRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify in database
    const [sentence] = (await sql`
      SELECT is_flagged FROM sentences WHERE id = ${testSentenceId}
    `) as { is_flagged: boolean }[];
    expect(sentence.is_flagged).toBe(true);

    const flaggedRows = (await sql`
      SELECT * FROM flagged_sentences WHERE sentence_id = ${testSentenceId}
    `) as { reason: string; suggested_fix: string; original_text: string }[];
    expect(flaggedRows.length).toBe(1);
    expect(flaggedRows[0].reason).toBe("bad_translation");
    expect(flaggedRows[0].suggested_fix).toBe("Traduction corrigée par le studio");
    expect(flaggedRows[0].original_text).toBe(testText);
  });

  it("ensures the flagged sentence is filtered out by studio queue query condition", async () => {
    const activeUnflagged = (await sql`
      SELECT id FROM sentences
      WHERE id = ${testSentenceId}
        AND is_active = TRUE
        AND is_flagged = FALSE
        AND (recording_status IS NULL OR recording_status = 'pending')
    `) as { id: string }[];

    expect(activeUnflagged.length).toBe(0);
  });
});
