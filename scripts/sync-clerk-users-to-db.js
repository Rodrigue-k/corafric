const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
const { createClerkClient } = require('@clerk/backend');

// Load .env
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
    process.env[key] = val;
  }
});

function getPostgresOptions(urlStr) {
  const regex = /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;
  const match = urlStr.match(regex);
  if (match) {
    const [, user, rawPassword, host, portStr, database] = match;
    return {
      host,
      port: portStr ? parseInt(portStr, 10) : 5432,
      user: decodeURIComponent(user),
      password: decodeURIComponent(rawPassword),
      database: decodeURIComponent(database),
      max: 1,
      prepare: false,
    };
  }
  return urlStr;
}

const sql = postgres(getPostgresOptions(process.env.DATABASE_URL));
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  console.log("1. Adding missing columns to users table if needed...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'contributor'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;

  console.log("2. Cleaning up test accounts from database...");
  try { await sql`DELETE FROM validations WHERE user_id LIKE 'test_%'`; } catch {}
  try { await sql`DELETE FROM recordings WHERE user_id LIKE 'test_%'`; } catch {}
  try { await sql`DELETE FROM dictionary_suggestions WHERE user_id LIKE 'test_%'`; } catch {}
  try { await sql`DELETE FROM suggestions WHERE user_id LIKE 'test_%'`; } catch {}
  try { await sql`DELETE FROM users WHERE id LIKE 'test_%'`; } catch {}

  console.log("3. Fetching all real users from Clerk...");
  const clerkResponse = await clerk.users.getUserList({ limit: 100 });
  const clerkUsers = clerkResponse.data || clerkResponse;

  console.log(`Found ${clerkUsers.length} users in Clerk.`);

  for (const u of clerkUsers) {
    const email = u.emailAddresses?.find(e => e.id === u.primaryEmailAddressId)?.emailAddress || u.emailAddresses?.[0]?.emailAddress || null;
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const username = u.username || [firstName, lastName].filter(Boolean).join(" ") || "Utilisateur";
    const isSuperAdmin = email && email.toLowerCase() === "koudakporodrigue03@gmail.com";
    const role = isSuperAdmin ? "super_admin" : ((u.publicMetadata?.role) || "contributor");

    console.log(`- Syncing: ${firstName} ${lastName} (${email}) => role: ${role}`);

    await sql`
      INSERT INTO users (id, username, email, first_name, last_name, role, country, native_language)
      VALUES (${u.id}, ${username}, ${email}, ${firstName}, ${lastName}, ${role}, 'Togo', 'ewe')
      ON CONFLICT (id) DO UPDATE SET
        email = ${email},
        first_name = ${firstName},
        last_name = ${lastName},
        username = ${username},
        role = ${role}
    `;

    // Ensure Clerk publicMetadata is also synchronized
    if (isSuperAdmin) {
      await clerk.users.updateUserMetadata(u.id, {
        publicMetadata: { role: "super_admin" }
      });
    }
  }

  console.log("Sync completed successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
