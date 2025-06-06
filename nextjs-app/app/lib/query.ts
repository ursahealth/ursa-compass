import _ from "lodash";
import pg from "pg";

interface PostgresError extends Error {
  code?: string;
}

let pool: pg.Pool | null = null;

function isPostgresTransientError(err: PostgresError): boolean {
  if (
    _.includes(err.message, "Client has encountered a connection error") ||
    _.includes(err.message, "terminating connection") ||
    _.includes(err.message, "Connection terminated") ||
    _.includes(["ECONNRESET", "ECONNREFUSED"], err.code)
  ) {
    return true;
  }

  return false;
}

// Execute a query.
export default async function query(
  sql: string,
  options: {},
  retryCount: number = 0,
): Promise<any[]> {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.TARGET_DATABASE_URL,
      ssl: !process.env.REJECT_PG_UNAUTHORIZED ? { rejectUnauthorized: false } : true,
    });

    pool.on("error", (err) => {
      console.error("Caught pg error:", err.message);
    });
  }
  try {
    const result = await pool.query(sql);
    return result.rows;
  } catch (err) {
    if (err instanceof Error && isPostgresTransientError(err) && retryCount < 4) {
      retryCount++;
      console.log("Application DB error is transient, trying again. Retry count", retryCount);
      await new Promise((waitResolve) => {
        // the wait lengthens upon subsequent failures
        setTimeout(() => waitResolve(null), 1000 * 4 ** retryCount);
      });
      const result2 = await query(sql, options, retryCount);
      return result2;
    }

    throw err;
  }
}
