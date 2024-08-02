import _ from "lodash";
import pg from "pg";

let pool;

function isTransientError(err) {
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

/**
  Execute a query.
*/
export default async function query(sql, params, retryCount = 0) {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.TARGET_DATABASE_URL,
      ssl: {
        rejectUnauthorized: !process.env.ALLOW_PG_UNAUTHORIZED,
      },
    });

    pool.on("error", (err) => {
      console.error("Caught pg error:", err.message);
    });
  }
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    if (err instanceof Error && isTransientError(err) && retryCount < 4) {
      retryCount++;
      console.log("Application DB error is transient, trying again. Retry count", retryCount);
      await new Promise((waitResolve) => {
        // the wait lengthens upon subsequent failures
        setTimeout(() => waitResolve(null), 1000 * 4 ** retryCount);
      });
      const result2 = await query(sql, params, retryCount);
      return result2;
    }

    throw err;
  }
}
