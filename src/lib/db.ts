import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var _postgresSql: ReturnType<typeof postgres> | undefined;
}

function getPostgresOptions(urlStr: string) {
  try {
    // Attempt standard URL parse first
    // If URL contains special chars like # unencoded, parse with regex
    const regex = /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;
    const match = urlStr.match(regex);

    if (match) {
      const [, user, rawPassword, host, portStr, database] = match;
      const decodedPassword = decodeURIComponent(rawPassword);
      return {
        host,
        port: portStr ? parseInt(portStr, 10) : 5432,
        user: decodeURIComponent(user),
        password: decodedPassword,
        database: decodeURIComponent(database),
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
        prepare: false,
      };
    }
  } catch {
    // fallback
  }

  return urlStr;
}

// Universal High-Performance PostgreSQL connection pool
export const sql = databaseUrl
  ? (global._postgresSql ??= postgres(getPostgresOptions(databaseUrl) as any))
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
