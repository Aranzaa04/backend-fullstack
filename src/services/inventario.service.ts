import { pool } from "../db/postgres";

export type Inventario = {
  id: number;
  tipo: string;
  peso: number | null;
  precio: number | null;
  cantidad: number | null;
};

export async function getInventario() {
  const result = await pool.query(
    `SELECT id, tipo, peso, precio, cantidad
     FROM inventario
     ORDER BY id DESC`
  );
  return result.rows;
}

export async function createInventario(payload: Partial<Inventario>) {
  const { tipo, peso, precio, cantidad } = payload;

  const result = await pool.query(
    `INSERT INTO inventario (tipo, peso, precio, cantidad)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tipo, peso, precio, cantidad`,
    [tipo ?? null, peso ?? null, precio ?? null, cantidad ?? null]
  );

  return result.rows[0];
}

export async function updateInventario(id: number, payload: Partial<Inventario>) {
  const { tipo, peso, precio, cantidad } = payload;

  const result = await pool.query(
    `UPDATE inventario
     SET tipo = COALESCE($1, tipo),
         peso = COALESCE($2, peso),
         precio = COALESCE($3, precio),
         cantidad = COALESCE($4, cantidad)
     WHERE id = $5
     RETURNING id, tipo, peso, precio, cantidad`,
    [tipo ?? null, peso ?? null, precio ?? null, cantidad ?? null, id]
  );

  return result.rowCount ? result.rows[0] : null;
}

export async function deleteInventario(id: number) {
  const result = await pool.query(
    `DELETE FROM inventario WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount ? result.rows[0].id : null;
}
