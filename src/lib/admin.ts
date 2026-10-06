import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "./db";

export const SUPER_ADMIN_EMAILS = [
  "koudakporodrigue03@gmail.com",
];

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

    let user: any = null;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    if (!user) return false;

    // 1. Check Super Admin Emails list
    const userEmails = (user.emailAddresses || [])
      .map((e: { emailAddress?: string }) => e.emailAddress?.toLowerCase())
      .filter(Boolean);

    if (userEmails.some((email: string) => SUPER_ADMIN_EMAILS.includes(email))) {
      return true;
    }

    // 2. Check Clerk public/private metadata role
    const role = (user.publicMetadata as { role?: string })?.role;
    if (role === "admin" || role === "operator") return true;

    // 3. Check ADMIN_USER_IDS from environment (comma-separated Clerk IDs)
    const adminIds = (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (adminIds.includes(userId)) return true;

    // 4. Check ADMIN_EMAILS from environment
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (userEmails.some((email: string) => adminEmails.includes(email))) return true;

    // 5. Check Database role if user exists in DB
    try {
      const dbUsers = (await sql`
        SELECT role FROM users WHERE id = ${userId}
      `) as { role?: string }[];
      if (dbUsers.length > 0 && (dbUsers[0].role === "admin" || dbUsers[0].role === "operator" || dbUsers[0].role === "super_admin")) {
        return true;
      }
    } catch {
      // Ignore if table/column not yet migrated
    }

    // If no admins are explicitly set in env, allow logged in users in development mode for easier onboarding
    if (process.env.NODE_ENV === "development" && adminIds.length === 0 && adminEmails.length === 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin permission:", error);
    return false;
  }
}
