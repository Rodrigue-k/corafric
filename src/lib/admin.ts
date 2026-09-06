import { auth, currentUser } from "@clerk/nextjs/server";

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await currentUser();
    if (!user) return false;

    // 1. Check Clerk public/private metadata role
    const role = (user.publicMetadata as { role?: string })?.role;
    if (role === "admin") return true;

    // 2. Check ADMIN_USER_IDS from environment (comma-separated Clerk IDs)
    const adminIds = (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (adminIds.includes(userId)) return true;

    // 3. Check ADMIN_EMAILS from environment
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    if (userEmails.some((email) => adminEmails.includes(email))) return true;

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
