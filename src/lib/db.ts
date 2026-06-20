import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

// Safely instantiate neon client to prevent build errors when DATABASE_URL is missing
export const sql = databaseUrl
  ? neon(databaseUrl)
  : (() => {
      console.warn("Warning: DATABASE_URL is not set. Database queries will return empty arrays.");
      const mockSql = async () => [];
      return mockSql as any;
    })();

export async function ensureDbUser(userId: string, username: string) {
  try {
    if (!databaseUrl) {
      console.warn("Skipping ensureDbUser: DATABASE_URL is not set.");
      return;
    }
    await sql`
      INSERT INTO users (id, username, country, native_language)
      VALUES (${userId}, ${username}, 'Togo', 'ewe')
      ON CONFLICT (id) DO UPDATE SET username = ${username}
    `;
  } catch (error) {
    console.error("Error in ensureDbUser:", error);
  }
}
