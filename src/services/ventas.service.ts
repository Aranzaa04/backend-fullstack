import { pool } from "../db/postgres";

export async function getVentas() {
  const result = await pool.query(
    `SELECT id, usuario_id, total, fecha
     FROM ventas
     ORDER BY fecha DESC NULLS LAST`
  );
  return result.rows;
}

export async function getVentaById(id: string) {
  const result = await pool.query(
    `SELECT id, usuario_id, total, fecha
     FROM ventas
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createVenta(data: {
  usuario_id: string;
  total: number;
  fecha?: string;
}) {
  const { usuario_id, total, fecha } = data;

  const result = await pool.query(
    `INSERT INTO ventas (usuario_id, total, fecha)
     VALUES ($1, $2, $3)
     RETURNING id, usuario_id, total, fecha`,
    [usuario_id, total, fecha ?? null]
  );

  return result.rows[0];
}

export async function updateVenta(
  id: string,
  data: Partial<{ usuario_id: string; total: number; fecha: string }>
) {
  const { usuario_id, total, fecha } = data;

  const result = await pool.query(
    `UPDATE ventas
     SET usuario_id = COALESCE($1, usuario_id),
         total      = COALESCE($2, total),
         fecha      = COALESCE($3, fecha)
     WHERE id = $4
     RETURNING id, usuario_id, total, fecha`,
    [usuario_id ?? null, total ?? null, fecha ?? null, id]
  );

  return result.rows[0] ?? null;
}

export async function deleteVenta(id: string) {
  const result = await pool.query(
    `DELETE FROM ventas WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] ?? null;
}
