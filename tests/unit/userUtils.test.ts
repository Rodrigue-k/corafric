import { describe, it, expect } from "vitest";
import { formatDisplayName, generateDefaultUsername } from "@/lib/userUtils";

describe("userUtils - formatDisplayName", () => {
  it("returns user-defined custom username when not a raw technical ID", () => {
    expect(formatDisplayName("Rodrigue")).toBe("Rodrigue");
    expect(formatDisplayName("Koffi_Dev")).toBe("Koffi_Dev");
    expect(formatDisplayName("Mawuli99")).toBe("Mawuli99");
  });

  it("cleans raw technical IDs like contributeur_user_3ID37G", () => {
    const rawName = "contributeur_user_3ID37G6eiWJ";
    const result = formatDisplayName(rawName);
    expect(result).toBe("Contributeur #3ID37G");
    expect(result).not.toContain("user_");
    expect(result).not.toContain("contributeur_user_");
  });

  it("prioritizes Clerk user firstName over raw technical IDs", () => {
    const clerkUser = {
      firstName: "Rodrigue",
      lastName: "Kouda",
      username: null,
      emailAddresses: [{ emailAddress: "rodrigue@example.com" }],
    };
    const result = formatDisplayName("contributeur_user_3ID37G", clerkUser, "user_3ID37G");
    expect(result).toBe("Rodrigue K.");
  });

  it("uses email prefix if no firstName or username is set in Clerk", () => {
    const clerkUser = {
      firstName: null,
      lastName: null,
      username: null,
      emailAddresses: [{ emailAddress: "africavoice2026@gmail.com" }],
    };
    const result = formatDisplayName(null, clerkUser, "user_987654");
    expect(result).toBe("africavoice2026");
  });

  it("creates a clean friendly format from userId when no other info exists", () => {
    const result = formatDisplayName(null, null, "user_3Hd7fFSYuVAjnb");
    expect(result).toBe("Contributeur #3HD7FF");
  });

  it("handles null, undefined and empty inputs without crashing", () => {
    expect(formatDisplayName(null, null, null)).toBe("Contributeur");
    expect(formatDisplayName("", undefined, undefined)).toBe("Contributeur");
  });
});

describe("userUtils - generateDefaultUsername", () => {
  it("generates a clean sanitized handle from Clerk username", () => {
    const clerkUser = { username: "Rodrigue Dev!", firstName: null, emailAddresses: [] };
    expect(generateDefaultUsername("user_123456", clerkUser)).toBe("RodrigueDev");
  });

  it("generates a handle from firstName + short ID suffix", () => {
    const clerkUser = { username: null, firstName: "Gracia", emailAddresses: [] };
    const handle = generateDefaultUsername("user_3Hd7fF", clerkUser);
    expect(handle).toBe("Gracia_3Hd7");
  });

  it("generates a fallback Pionnier_XXXXXX when no profile data is provided", () => {
    const handle = generateDefaultUsername("user_3Hd7fFSYu");
    expect(handle).toBe("Pionnier_3Hd7fF");
  });
});
