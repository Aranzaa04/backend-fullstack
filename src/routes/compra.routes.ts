import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/compra
 * Lista compras (tickets finales)
 */
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, total, metodo_pago, referencia, fecha, creado_en
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
 * Compra + items (venta detalle)
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const compra = await pool.query(
      `select id, total, metodo_pago, referencia, fecha, creado_en
       from compra
       where id = $1`,
      [id]
    );
    if (!compra.rows[0]) return res.status(404).json({ error: "Compra no encontrada" });

    const items = await pool.query(
      `select v.id, v.venta_id, v.producto_id, i.tipo, i.peso,
              v.cantidad, v.precio_unitario, v.subtotal, v.creado_en
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
 * Body:
 * {
 *   "metodo_pago": "efectivo|tarjeta|transferencia",
 *   "referencia": "opcional",
 *   "items": [{ "producto_id": 1, "cantidad": 2 }]
 * }
 *
 * ✅ SIN TRIGGERS:
 *  - valida stock
 *  - calcula total
 *  - descuenta inventario
 *  - inserta compra + venta(detalle)
 */
router.post("/checkout", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { items, metodo_pago, referencia } = req.body as {
      items: { producto_id: number; cantidad: number }[];
      metodo_pago?: string;
      referencia?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items es requerido y debe tener al menos 1 elemento" });
    }

    const metodo = (typeof metodo_pago === "string" && metodo_pago.trim())
      ? metodo_pago.trim().toLowerCase()
      : "efectivo";

    await client.query("begin");

    // 1) Crear compra (total lo actualizamos al final)
    const compraIns = await client.query(
      `insert into compra (total, metodo_pago, referencia)
       values (0, $1, $2)
       returning id, total, metodo_pago, referencia, fecha, creado_en`,
      [metodo, referencia ?? null]
    );
    const compraId = compraIns.rows[0].id;

    let total = 0;
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

      // 2) Leer inventario y bloquear fila (FOR UPDATE)
      const inv = await client.query(
        `select id, precio, cantidad
         from inventario
         where id = $1
         for update`,
        [producto_id]
      );

      if (!inv.rows[0]) {
        await client.query("rollback");
        return res.status(400).json({ error: `Producto no encontrado: ${producto_id}` });
      }

      const stock = Number(inv.rows[0].cantidad);
      const precio_unitario = Number(inv.rows[0].precio);

      if (!Number.isFinite(precio_unitario) || precio_unitario < 0) {
        await client.query("rollback");
        return res.status(400).json({ error: `Precio inválido en inventario para producto ${producto_id}` });
      }

      if (stock < cantidad) {
        await client.query("rollback");
        return res.status(400).json({ error: `Stock insuficiente (producto ${producto_id}). Stock=${stock}` });
      }

      const subtotal = precio_unitario * cantidad;
      total += subtotal;

      // 3) Insertar detalle en venta
      const v = await client.query(
        `insert into venta (venta_id, producto_id, cantidad, precio_unitario)
         values ($1, $2, $3, $4)
         returning id, venta_id, producto_id, cantidad, precio_unitario, subtotal, creado_en`,
        [compraId, producto_id, cantidad, precio_unitario]
      );
      insertedItems.push(v.rows[0]);

      // 4) Descontar stock
      await client.query(
        `update inventario
         set cantidad = cantidad - $1
         where id = $2`,
        [cantidad, producto_id]
      );
    }

    // 5) Actualizar total final en compra
    const compraFinal = await client.query(
      `update compra
       set total = $1
       where id = $2
       returning id, total, metodo_pago, referencia, fecha, creado_en`,
      [total, compraId]
    );

    await client.query("commit");

    res.status(201).json({
      ok: true,
      compra: compraFinal.rows[0],
      items: insertedItems,
    });
  } catch (e) {
    await client.query("rollback");
    next(e);
  } finally {
    client.release();
  }
});

export default router;

