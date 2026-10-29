import "server-only";
import postgres from "postgres";

let connection: ReturnType<typeof postgres> | undefined;
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  connection ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return connection;
}
