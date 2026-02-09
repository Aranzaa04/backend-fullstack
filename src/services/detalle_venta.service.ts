import { pool } from "../db/postgres";

export async function getDetalleVenta() {
  const { rows } = await pool.query(
    `SELECT id, venta_id, producto_id, cantidad, precio_unitario
     FROM detalle_venta
     ORDER BY id DESC`
  );
  return rows;
}
