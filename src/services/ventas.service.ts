import { pool } from "../db/postgres";

// =======================
// GET ventas
// =======================
export async function getVentas() {
  const { rows } = await pool.query(
    `SELECT * FROM venta ORDER BY fecha DESC`
  );
  return rows;
}

export async function getVentaById(id: number) {
  const { rows } = await pool.query(
    `SELECT * FROM venta WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

// =======================
// CREATE venta simple
// =======================
export async function createVenta(payload: { total: number }) {
  const { rows } = await pool.query(
    `INSERT INTO venta (total, fecha)
     VALUES ($1, NOW())
     RETURNING *`,
    [payload.total]
  );
  return rows[0];
}

export async function deleteVenta(id: number) {
  const { rows } = await pool.query(
    `DELETE FROM venta WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

// =======================
// ✅ CHECKOUT COMPLETO
// =======================
export async function checkoutVenta(
  items: { producto_id: number; cantidad: number }[]
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Traer inventario
    const ids = items.map(i => i.producto_id);
    const invRes = await client.query(
      `SELECT id, tipo, precio, cantidad
       FROM inventario
       WHERE id = ANY($1::int[])`,
      [ids]
    );

    const map = new Map<number, any>();
    invRes.rows.forEach(r => map.set(r.id, r));

    // 2️⃣ Validaciones
    for (const it of items) {
      const p = map.get(it.producto_id);
      if (!p) throw new Error(`Producto no existe (id ${it.producto_id})`);
      if (p.cantidad < it.cantidad) {
        throw new Error(`Stock insuficiente de ${p.tipo}`);
      }
    }

    // 3️⃣ Total
    const total = items.reduce((acc, it) => {
      const p = map.get(it.producto_id);
      return acc + p.precio * it.cantidad;
    }, 0);

    // 4️⃣ Insertar en venta
    const ventaRes = await client.query(
      `INSERT INTO venta (total, fecha)
       VALUES ($1, NOW())
       RETURNING *`,
      [total]
    );

    const venta = ventaRes.rows[0];

    // 5️⃣ Insertar en compra (detalle)
    const detalles = [];

    for (const it of items) {
      const p = map.get(it.producto_id);

      const detRes = await client.query(
        `INSERT INTO compra (venta_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [venta.id, it.producto_id, it.cantidad, p.precio]
      );

      detalles.push(detRes.rows[0]);
    }

    // 🔥 Si tienes trigger → aquí se descuenta inventario automático
    await client.query("COMMIT");

    return { venta, compra: detalles };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
