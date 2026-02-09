import { pool } from "../db/postgres";

export async function getProductos() {
  const result = await pool.query(
    `SELECT id, tipo, peso, precio, cantidad
     FROM producto
     ORDER BY id DESC`
  );
  return result.rows;
}


export async function getProductoById(id: number): Promise<Producto | null> {
  const result = await pool.query(
    `SELECT id, tipo, peso, precio, cantidad
     FROM producto
     WHERE id = $1`,
    [id]
  );
  return result.rowCount ? result.rows[0] : null;
}

export async function createProducto(payload: Partial<Producto>): Promise<Producto> {
  const { tipo, peso, precio, cantidad } = payload;
  const result = await pool.query(
    `INSERT INTO producto (tipo, peso, precio, cantidad)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tipo, peso, precio, cantidad`,
    [tipo ?? null, peso ?? null, precio ?? null, cantidad ?? null]
  );
  return result.rows[0];
}

export async function updateProducto(id: number, payload: Partial<Producto>): Promise<Producto | null> {
  const { tipo, peso, precio, cantidad } = payload;
  const result = await pool.query(
    `UPDATE producto
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

export async function deleteProducto(id: number): Promise<number | null> {
  const result = await pool.query(`DELETE FROM producto WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount ? result.rows[0].id : null;
}
