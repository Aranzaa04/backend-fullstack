import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DATABASE_URL en variables de entorno");
}

export const pool = new Pool({
  connectionString,
  // Supabase suele requerir SSL en producción
  ssl:
    process.env.NODE_ENV === "production" || process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: false }
      : undefined,
});
