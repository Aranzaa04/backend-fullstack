import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/compra
 * Lista tickets (compra)
 */
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, total, fecha, creado_en
       from compra
       order by id desc`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/compra/:id
 * Compra + items (venta)
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const compra = await pool.query(
      `select id, total, fecha, creado_en
       from compra
       where id = $1`,
      [id]
    );

    if (!compra.rows[0]) return res.status(404).json({ error: "Compra no encontrada" });

    const items = await pool.query(
      `select v.id, v.venta_id, v.producto_id, i.tipo, v.cantidad, v.precio_unitario, v.subtotal, v.creado_en
       from venta v
       join inventario i on i.id = v.producto_id
       where v.venta_id = $1
       order by v.id asc`,
      [id]
    );

    res.json({ compra: compra.rows[0], items: items.rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/compra/checkout
 * Body: { items: [{ producto_id, cantidad }] }
 *
 * Crea compra y agrega items a venta.
 * - precio_unitario se toma de inventario
 * - trigger en Supabase resta stock y recalcula total
 */
router.post("/checkout", async (req, res) => {
  const client = await pool.connect();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items es requerido y debe tener al menos 1 elemento" });
    }

    await client.query("begin");

    // 1) Crear compra (total empieza 0, trigger lo recalcula)
    const compraIns = await client.query(
      `insert into compra default values returning id, total, fecha, creado_en`
    );
    const compraId = compraIns.rows[0].id;

    // 2) Insertar items en venta
    const insertedItems: any[] = [];

    for (const it of items) {
      const producto_id = Number(it?.producto_id);
      const cantidad = Number(it?.cantidad);

      if (!Number.isFinite(producto_id) || producto_id <= 0) {
        await client.query("rollback");
        return res.status(400).json({ error: "producto_id inválido" });
      }
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        await client.query("rollback");
        return res.status(400).json({ error: "cantidad inválida" });
      }

      // precio_unitario desde inventario
      const inv = await client.query(`select precio from inventario where id = $1`, [producto_id]);
      if (!inv.rows[0]) {
        await client.query("rollback");
        return res.status(400).json({ error: `Producto no encontrado: ${producto_id}` });
      }

      const precio_unitario = Number(inv.rows[0].precio);

      // Insert: tu trigger valida stock y resta inventario
      const v = await client.query(
        `insert into venta (venta_id, producto_id, cantidad, precio_unitario)
         values ($1, $2, $3, $4)
         returning id, venta_id, producto_id, cantidad, precio_unitario, subtotal, creado_en`,
        [compraId, producto_id, cantidad, precio_unitario]
      );

      insertedItems.push(v.rows[0]);
    }

    await client.query("commit");

    // 3) Leer compra final con total actualizado (trigger)
    const compraFinal = await pool.query(
      `select id, total, fecha, creado_en from compra where id = $1`,
      [compraId]
    );

    res.status(201).json({
      ok: true,
      compra: compraFinal.rows[0],
      items: insertedItems,
    });
  } catch (e: any) {
    await client.query("rollback");
    // Aquí caen errores del trigger (stock insuficiente, etc.)
    res.status(400).json({ error: e?.message ?? "Error en checkout" });
  } finally {
    client.release();
  }
});

export default router;