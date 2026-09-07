/**
 * Helper to clean and format user display names across the platform.
 * Eliminates raw technical IDs like 'contributeur_user_3ID' or 'validateur_user_...'.
 */

export function formatDisplayName(
  dbUsername?: string | null,
  clerkUser?: {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses?: { emailAddress: string }[];
  } | null,
  userId?: string | null
): string {
  // 1. If user has customized their username and it is not an auto-generated technical ID
  if (
    dbUsername &&
    !dbUsername.startsWith("contributeur_user_") &&
    !dbUsername.startsWith("validateur_user_") &&
    !dbUsername.startsWith("user_") &&
    dbUsername.trim().length > 0
  ) {
    return dbUsername.trim();
  }

  // 2. Check Clerk user profile
  if (clerkUser) {
    if (clerkUser.username && clerkUser.username.trim().length > 0) {
      return clerkUser.username.trim();
    }
    if (clerkUser.firstName && clerkUser.firstName.trim().length > 0) {
      const first = clerkUser.firstName.trim();
      const lastInitial = clerkUser.lastName ? ` ${clerkUser.lastName.trim()[0]}.` : "";
      return `${first}${lastInitial}`;
    }
    if (clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) {
      const emailPrefix = clerkUser.emailAddresses[0].emailAddress.split("@")[0];
      if (emailPrefix) {
        return emailPrefix.replace(/[^a-zA-Z0-9_-]/g, "");
      }
    }
  }

  // 3. Clean fallback from userId (e.g. user_3ID37... -> Contributeur #3ID37)
  if (userId) {
    const cleanId = userId.replace(/^user_/, "").substring(0, 6).toUpperCase();
    return `Contributeur #${cleanId}`;
  }

  // 4. If dbUsername was e.g. contributeur_user_3ID, clean it to Contributeur #3ID
  if (dbUsername && dbUsername.includes("user_")) {
    const cleanPart = dbUsername.split("user_")[1]?.substring(0, 6).toUpperCase();
    return cleanPart ? `Contributeur #${cleanPart}` : "Contributeur";
  }

  return dbUsername || "Contributeur";
}

/**
 * Generate a clean default handle for database storage (no special characters, max 30 chars).
 */
export function generateDefaultUsername(
  userId: string,
  clerkUser?: {
    username?: string | null;
    firstName?: string | null;
    emailAddresses?: { emailAddress: string }[];
  } | null
): string {
  if (clerkUser?.username) {
    return clerkUser.username.trim().replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 30);
  }
  if (clerkUser?.firstName) {
    const cleanFirst = clerkUser.firstName.trim().replace(/[^a-zA-Z0-9_\-]/g, "");
    if (cleanFirst.length >= 2) {
      const shortSuffix = userId.replace(/^user_/, "").slice(0, 4);
      return `${cleanFirst}_${shortSuffix}`.slice(0, 30);
    }
  }
  if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
    const prefix = clerkUser.emailAddresses[0].emailAddress.split("@")[0].replace(/[^a-zA-Z0-9_\-]/g, "");
    if (prefix.length >= 2) {
      return prefix.slice(0, 30);
    }
  }

  const cleanSuffix = userId.replace(/^user_/, "").slice(0, 6);
  return `Pionnier_${cleanSuffix}`;
}
