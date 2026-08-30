import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var _postgresSql: ReturnType<typeof postgres> | undefined;
}

// Universal High-Performance PostgreSQL connection pool
export const sql = databaseUrl
  ? (global._postgresSql ??= postgres(databaseUrl, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      prepare: false, // Compatibility with multi-project connection pooling
    }))
  : (() => {
      console.warn("Warning: DATABASE_URL is not set. Database queries will return empty arrays.");
      const mockSql = async () => [];
      return mockSql as unknown as ReturnType<typeof postgres>;
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
