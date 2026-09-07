import { describe, it, expect } from "vitest";
import { textToIPA, getPhonemeRules } from "@/lib/tts/ewe_rules";

describe("ewe_rules - Phoneme mapping & textToIPA", () => {
  it("loads phoneme mapping rules correctly", async () => {
    const rules = await getPhonemeRules();
    expect(rules).toBeDefined();
    expect(rules["ɖ"]).toBe("ɖ");
    expect(rules["ƒ"]).toBe("ɸ");
    expect(rules["ɣ"]).toBe("ɣ");
    expect(rules["ŋ"]).toBe("ŋ");
    expect(rules["ʋ"]).toBe("β");
    expect(rules["ɛ"]).toBe("ɛ");
    expect(rules["ɔ"]).toBe("ɔ");
  });

  it("converts simple Ewe words to IPA notation", async () => {
    const ipa = await textToIPA("akpe");
    expect(ipa).toBeDefined();
    expect(ipa.length).toBeGreaterThan(0);
    expect(ipa).toContain("k");
    expect(ipa).toContain("p");
  });

  it("handles Ewe special characters properly", async () => {
    const ipa = await textToIPA("nuɖuɖu");
    expect(ipa).toBe("[[n]][[u]][[d]][[u]][[d]][[u]]");
  });

  it("handles empty and whitespace strings gracefully", async () => {
    const ipa = await textToIPA("   ");
    expect(ipa.trim()).toBe("");
  });
});
