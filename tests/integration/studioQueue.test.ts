import { describe, it, expect } from "vitest";
import { GET as nextRoute } from "@/app/api/studio/next/route";
import { GET as statsRoute } from "@/app/api/studio/stats/route";

describe("Integration - Studio Queue and Live Statistics", () => {
  it("fetches a clean batch of sentences with proper limits", async () => {
    const req = new Request("http://localhost:3000/api/studio/next?limit=5");
    const res = await nextRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.sentences)).toBe(true);
    expect(data.sentences.length).toBeLessThanOrEqual(5);

    if (data.sentences.length > 0) {
      const first = data.sentences[0];
      expect(first.id).toBeDefined();
      expect(first.text).toBeDefined();
      expect(typeof first.text).toBe("string");
      expect(first.language).toBe("ewe");
    }
  });

  it("retrieves studio live statistics accurately", async () => {
    const res = await statsRoute();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(typeof data.studioRecordings).toBe("number");
    expect(typeof data.totalRecordings).toBe("number");
    expect(typeof data.todayRecordings).toBe("number");
    expect(typeof data.totalDurationSeconds).toBe("number");
    expect(typeof data.availableSentences).toBe("number");
    expect(typeof data.flaggedSentences).toBe("number");
  });
});
