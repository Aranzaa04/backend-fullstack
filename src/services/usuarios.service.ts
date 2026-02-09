import { pool } from "../db/postgres";

export async function getUsuarios() {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, creado_en
     FROM usuarios
     ORDER BY creado_en DESC`
  );
  return rows;
}
