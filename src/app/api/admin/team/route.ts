import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isCurrentUserSuperAdmin, SUPER_ADMIN_EMAILS } from "@/lib/admin";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safeIsoDate(val: unknown): string {
  try {
    if (!val) return new Date().toISOString();
    const d = new Date(val as string | number | Date);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function GET() {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé au Super Administrateur." }, { status: 403 });
    }

    // 1. Ensure required columns exist
    try {
      await sql`
        ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'contributor',
          ADD COLUMN IF NOT EXISTS email TEXT,
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      `;
    } catch {
      // Ignore if columns already exist
    }

    // 2. Fetch users from DB for contribution counts & metadata
    let dbUsers: any[] = [];
    try {
      dbUsers = (await sql`
        SELECT id, username, email, first_name, last_name, country, native_language, role, total_contributions, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 200
      `) as any[];
    } catch (dbErr) {
      console.warn("Could not query users table:", dbErr);
    }

    const dbUserById = new Map<string, any>();
    const dbUserByEmail = new Map<string, any>();

    dbUsers.forEach((u) => {
      if (u.id) dbUserById.set(u.id, u);
      if (u.email) dbUserByEmail.set(u.email.toLowerCase(), u);
    });

    // 3. Fetch active users from Clerk instance
    let clerkUsers: any[] = [];
    try {
      const client = await clerkClient();
      const response = await client.users.getUserList({ limit: 100 });
      clerkUsers = response?.data || (Array.isArray(response) ? response : []);
    } catch (err) {
      console.warn("Could not fetch Clerk user list:", err);
    }

    // 4. Build combined users list with strict email-based deduplication
    const usersByEmailOrId = new Map<string, any>();

    const getDedupKey = (email: string | null | undefined, id: string) => {
      return email && email.trim() ? email.trim().toLowerCase() : `id:${id}`;
    };

    // A. Add Clerk users (if available)
    if (clerkUsers.length > 0) {
      const syncPromises: Promise<any>[] = [];

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
          `user_${cUser.id.slice(-6)}`;

        const isSuperAdminEmail = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
        const role = isSuperAdminEmail
          ? "super_admin"
          : ((cUser.publicMetadata?.role as string) || dbUser?.role || "contributor");

        // Sync into PostgreSQL in parallel safely without crashing on username conflicts
        syncPromises.push(
          sql`
            UPDATE users 
            SET 
              role = ${role},
              email = COALESCE(${email}, email),
              first_name = COALESCE(${firstName}, first_name),
              last_name = COALESCE(${lastName}, last_name),
              updated_at = NOW()
            WHERE id = ${cUser.id}
          `.then(async (res) => {
            if (res.count === 0) {
              await sql`
                INSERT INTO users (id, username, email, first_name, last_name, role, country, native_language, updated_at)
                VALUES (${cUser.id}, ${username}, ${email}, ${firstName}, ${lastName}, ${role}, 'Togo', 'ewe', NOW())
                ON CONFLICT (id) DO UPDATE SET
                  email = COALESCE(EXCLUDED.email, users.email),
                  role = EXCLUDED.role,
                  updated_at = NOW()
              `.catch(() => {});
            }
          }).catch(() => {})
        );

        const key = getDedupKey(email, cUser.id);
        usersByEmailOrId.set(key, {
          id: cUser.id,
          firstName,
          lastName,
          username,
          email,
          role,
          country: dbUser?.country || "Togo",
          total_contributions: dbUser?.total_contributions || 0,
          created_at: safeIsoDate(cUser.createdAt || dbUser?.created_at),
        });
      }

      // Execute all sync queries concurrently without blocking if some fail
      await Promise.allSettled(syncPromises);
    }

    // B. Fallback/Complement from dbUsers for any users not present in Clerk list
    for (const dUser of dbUsers) {
      const key = getDedupKey(dUser.email, dUser.id);
      if (!usersByEmailOrId.has(key)) {
        const isSuperAdminEmail = dUser.email && SUPER_ADMIN_EMAILS.includes(dUser.email.toLowerCase());
        const role = isSuperAdminEmail ? "super_admin" : (dUser.role || "contributor");

        usersByEmailOrId.set(key, {
          id: dUser.id,
          firstName: dUser.first_name || "",
          lastName: dUser.last_name || "",
          username: dUser.username || "Utilisateur",
          email: dUser.email || null,
          role,
          country: dUser.country || "Togo",
          total_contributions: dUser.total_contributions || 0,
          created_at: safeIsoDate(dUser.created_at),
        });
      } else {
        // Retain highest contributions count from existing records
        const existing = usersByEmailOrId.get(key);
        if (Number(dUser.total_contributions || 0) > Number(existing.total_contributions || 0)) {
          existing.total_contributions = Number(dUser.total_contributions);
        }
      }
    }

    const usersList = Array.from(usersByEmailOrId.values());

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
      username = clerkUser.username || [firstName, lastName].filter(Boolean).join(" ") || `user_${targetUserId.slice(-6)}`;

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

    // 2. Update existing user in PostgreSQL users table
    const updateResult = await sql`
      UPDATE users 
      SET 
        role = ${newRole},
        email = COALESCE(${userEmail}, email),
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        updated_at = NOW()
      WHERE id = ${targetUserId}
      RETURNING id
    `;

    // If user does not exist in DB yet, insert safely with fallback unique username
    if (updateResult.length === 0) {
      const safeUsername = username || `user_${targetUserId.slice(-6)}`;
      await sql`
        INSERT INTO users (id, role, email, first_name, last_name, username, updated_at)
        VALUES (${targetUserId}, ${newRole}, ${userEmail}, ${firstName}, ${lastName}, ${safeUsername}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          updated_at = NOW()
      `.catch(async () => {
        // Fallback with randomized suffix in case username was already taken
        await sql`
          INSERT INTO users (id, role, email, first_name, last_name, username, updated_at)
          VALUES (${targetUserId}, ${newRole}, ${userEmail}, ${firstName}, ${lastName}, ${safeUsername + '_' + Date.now().toString().slice(-4)}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            updated_at = NOW()
        `.catch(() => {});
      });
    }

    // Also update by email in case of multiple DB aliases
    if (userEmail) {
      await sql`
        UPDATE users
        SET role = ${newRole}, updated_at = NOW()
        WHERE LOWER(email) = ${userEmail.toLowerCase()}
      `.catch(() => {});
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
