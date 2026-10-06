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
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
      `;
    } catch {
      // Ignore if columns already exist
    }

    // 2. Fetch users from DB for contribution counts & metadata
    const dbUsers = (await sql`
      SELECT id, username, email, first_name, last_name, country, native_language, role, total_contributions, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 200
    `) as any[];

    const dbUserById = new Map<string, any>();
    const dbUserByEmail = new Map<string, any>();

    dbUsers.forEach((u) => {
      if (u.id) dbUserById.set(u.id, u);
      if (u.email) dbUserByEmail.set(u.email.toLowerCase(), u);
    });

    // 3. Fetch active users strictly from the current Clerk instance (Dev or Prod)
    let clerkUsers: any[] = [];
    try {
      const client = await clerkClient();
      const response = await client.users.getUserList({ limit: 100 });
      clerkUsers = response?.data || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn("Could not fetch Clerk user list:", err);
    }

    // 4. Map active Clerk users only
    const usersList: any[] = [];

    for (const cUser of clerkUsers) {
      const email =
        cUser.emailAddresses?.find((e: any) => e.id === cUser.primaryEmailAddressId)?.emailAddress ||
        cUser.emailAddresses?.[0]?.emailAddress ||
        null;
      
      const dbUser = dbUserById.get(cUser.id) || (email ? dbUserByEmail.get(email.toLowerCase()) : null);
      const firstName = cUser.firstName || dbUser?.first_name || "";
      const lastName = cUser.lastName || dbUser?.last_name || "";
      const username =
        cUser.username ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        dbUser?.username ||
        "Utilisateur";

      const isSuperAdminEmail = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
      
      const role = isSuperAdminEmail 
        ? "super_admin" 
        : ((cUser.publicMetadata?.role as string) || dbUser?.role || "contributor");

      // Auto-sync active user into PostgreSQL
      try {
        await sql`
          INSERT INTO users (id, username, email, first_name, last_name, role, country, native_language)
          VALUES (${cUser.id}, ${username}, ${email}, ${firstName}, ${lastName}, ${role}, 'Togo', 'ewe')
          ON CONFLICT (id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, users.email),
            first_name = COALESCE(EXCLUDED.first_name, users.first_name),
            last_name = COALESCE(EXCLUDED.last_name, users.last_name),
            username = COALESCE(EXCLUDED.username, users.username),
            role = EXCLUDED.role
        `;
      } catch {
        // ignore auto-sync errors
      }

      usersList.push({
        id: cUser.id,
        firstName,
        lastName,
        username,
        email,
        role,
        country: dbUser?.country || "Togo",
        total_contributions: dbUser?.total_contributions || 0,
        created_at: cUser.createdAt ? new Date(cUser.createdAt).toISOString() : (dbUser?.created_at || new Date().toISOString()),
      });
    }

    // Sort: Super Admin first, then Operators, then Admins, then Contributors
    usersList.sort((a, b) => {
      const roleWeight = (role: string) => {
        if (role === "super_admin") return 4;
        if (role === "operator") return 3;
        if (role === "admin") return 2;
        return 1;
      };
      return roleWeight(b.role) - roleWeight(a.role);
    });

    return NextResponse.json({ users: usersList });
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
      userEmail =
        clerkUser.emailAddresses?.find((e: any) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        null;
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
    } catch (clerkErr: any) {
      console.warn("Clerk update metadata warning:", clerkErr?.message);
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

    // Also update by email in case of multiple DB aliases
    if (userEmail) {
      await sql`
        UPDATE users
        SET role = ${newRole}
        WHERE LOWER(email) = ${userEmail.toLowerCase()}
      `;
    }

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
