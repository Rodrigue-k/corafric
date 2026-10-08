import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "./db";

export const SUPER_ADMIN_EMAILS = [
  "koudakporodrigue03@gmail.com",
  "gabirusamaa@gmail.com",
];

/**
 * Checks if the current user is the Super Administrator (Rodrigue).
 * Strictly restricted to SUPER_ADMIN_EMAILS or explicit super_admin DB status.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch {
      userId = null;
    }

    if (!userId) return false;

    let user: any = null;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    if (user) {
      const userEmails = (user.emailAddresses || [])
        .map((e: { emailAddress?: string }) => e.emailAddress?.toLowerCase())
        .filter(Boolean);

      if (userEmails.some((email: string) => SUPER_ADMIN_EMAILS.includes(email))) {
        return true;
      }
    }

    // Check DB email
    try {
      const dbUsers = (await sql`
        SELECT email, role FROM users WHERE id = ${userId}
      `) as { email?: string; role?: string }[];
      if (dbUsers.length > 0) {
        if (dbUsers[0].email && SUPER_ADMIN_EMAILS.includes(dbUsers[0].email.toLowerCase())) {
          return true;
        }
        if (dbUsers[0].role === "super_admin") {
          return true;
        }
      }
    } catch {
      // Ignore
    }

    return false;
  } catch (error) {
    console.error("Error checking super admin permission:", error);
    return false;
  }
}

/**
 * Checks if the current user has access to Studio or production tools
 * (Super Admin, Administrator, or Studio Operator).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch {
      userId = null;
    }

    if (!userId) return false;

    // 1. Direct DB check (robust even if currentUser API call times out or fails)
    try {
      const dbUsers = (await sql`
        SELECT role, email FROM users WHERE id = ${userId}
      `) as { role?: string; email?: string }[];

      if (dbUsers.length > 0) {
        const dbRole = dbUsers[0].role;
        const dbEmail = dbUsers[0].email?.toLowerCase();

        if (dbEmail && SUPER_ADMIN_EMAILS.includes(dbEmail)) {
          return true;
        }
        if (dbRole === "admin" || dbRole === "operator" || dbRole === "super_admin") {
          return true;
        }
      }
    } catch {
      // Ignore if table not yet migrated
    }

    // 2. Check Clerk User Object
    let user: any = null;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    if (user) {
      // Check Super Admin Emails list
      const userEmails = (user.emailAddresses || [])
        .map((e: { emailAddress?: string }) => e.emailAddress?.toLowerCase())
        .filter(Boolean);

      if (userEmails.some((email: string) => SUPER_ADMIN_EMAILS.includes(email))) {
        return true;
      }

      // Check Clerk public/private metadata role
      const role = (user.publicMetadata as { role?: string })?.role;
      if (role === "admin" || role === "operator" || role === "super_admin") {
        return true;
      }

      // Check ADMIN_EMAILS from environment
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      if (userEmails.some((email: string) => adminEmails.includes(email))) {
        return true;
      }
    }

    // 3. Check ADMIN_USER_IDS from environment
    const adminIds = (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (adminIds.includes(userId)) return true;

    return false;
  } catch (error) {
    console.error("Error checking admin permission:", error);
    return false;
  }
}
