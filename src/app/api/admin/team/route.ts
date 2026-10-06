import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isCurrentUserSuperAdmin, SUPER_ADMIN_EMAILS } from "@/lib/admin";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé au Super Administrateur." }, { status: 403 });
    }

    // 1. Ensure columns exist in DB
    try {
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'contributor';
      `;
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      `;
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
      `;
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
      `;
    } catch {
      // Ignore if columns already exist
    }

    // 2. Fetch users from DB
    const dbUsers = (await sql`
      SELECT id, username, email, first_name, last_name, country, native_language, role, total_contributions, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `) as any[];

    const dbUserMap = new Map<string, any>();
    dbUsers.forEach((u) => dbUserMap.set(u.id, u));

    // 3. Fetch users from Clerk
    let clerkUsers: any[] = [];
    try {
      const client = await clerkClient();
      const response = await client.users.getUserList({ limit: 100 });
      clerkUsers = response?.data || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn("Could not fetch Clerk user list:", err);
    }

    // 4. Combine and normalize users list
    const combinedMap = new Map<string, any>();

    // Add Clerk users
    for (const cUser of clerkUsers) {
      const dbUser = dbUserMap.get(cUser.id);
      const email = cUser.emailAddresses?.[0]?.emailAddress || dbUser?.email || null;
      const firstName = cUser.firstName || dbUser?.first_name || "";
      const lastName = cUser.lastName || dbUser?.last_name || "";
      const isSuperAdminEmail = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
      
      const role = isSuperAdminEmail 
        ? "super_admin" 
        : ((cUser.publicMetadata?.role as string) || dbUser?.role || "contributor");

      combinedMap.set(cUser.id, {
        id: cUser.id,
        firstName,
        lastName,
        username: cUser.username || [firstName, lastName].filter(Boolean).join(" ") || dbUser?.username || "Utilisateur",
        email,
        role,
        country: dbUser?.country || "Togo",
        total_contributions: dbUser?.total_contributions || 0,
        created_at: cUser.createdAt ? new Date(cUser.createdAt).toISOString() : (dbUser?.created_at || new Date().toISOString()),
      });
    }

    // Add DB users that were not in Clerk list
    for (const dbUser of dbUsers) {
      if (!combinedMap.has(dbUser.id)) {
        const email = dbUser.email || null;
        const isSuperAdminEmail = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
        const role = isSuperAdminEmail ? "super_admin" : (dbUser.role || "contributor");

        combinedMap.set(dbUser.id, {
          id: dbUser.id,
          firstName: dbUser.first_name || "",
          lastName: dbUser.last_name || "",
          username: dbUser.username || [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || "Utilisateur",
          email,
          role,
          country: dbUser.country || "Togo",
          total_contributions: dbUser.total_contributions || 0,
          created_at: dbUser.created_at || new Date().toISOString(),
        });
      }
    }

    const users = Array.from(combinedMap.values());

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching team users:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des utilisateurs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé au Super Administrateur." }, { status: 403 });
    }

    const { targetUserId, newRole } = await request.json();
    if (!targetUserId || !["contributor", "operator", "admin"].includes(newRole)) {
      return NextResponse.json({ error: "Rôle invalide sélectionné." }, { status: 400 });
    }

    // 1. Update Clerk public metadata
    let userEmail: string | null = null;
    let firstName = "";
    let lastName = "";
    let username = "";

    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(targetUserId);
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || null;
      firstName = clerkUser.firstName || "";
      lastName = clerkUser.lastName || "";
      username = clerkUser.username || [firstName, lastName].filter(Boolean).join(" ") || "";

      if (userEmail && SUPER_ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
        return NextResponse.json(
          { error: "Le rôle du Super Administrateur ne peut pas être modifié." },
          { status: 403 }
        );
      }

      await client.users.updateUserMetadata(targetUserId, {
        publicMetadata: {
          role: newRole,
        },
      });
    } catch (clerkErr) {
      console.warn("Clerk update metadata warning:", clerkErr);
    }

    // 2. Upsert in PostgreSQL users table
    await sql`
      INSERT INTO users (id, role, email, first_name, last_name, username, updated_at)
      VALUES (${targetUserId}, ${newRole}, ${userEmail}, ${firstName}, ${lastName}, ${username || 'Utilisateur'}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        role = ${newRole},
        email = COALESCE(EXCLUDED.email, users.email),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      targetUserId,
      newRole,
      message: `Rôle mis à jour avec succès (${newRole})`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour du rôle" }, { status: 500 });
  }
}
