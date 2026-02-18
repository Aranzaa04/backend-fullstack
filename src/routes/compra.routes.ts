import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/compra
 * Lista tickets (cabecera)
 */
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, total, fecha, creado_en
       from compra
       order by creado_en desc`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/compra/:id
 * Devuelve una compra + sus líneas
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

    const detalle = await pool.query(
      `select v.id, v.venta_id, v.producto_id, i.tipo, v.cantidad, v.precio_unitario, v.subtotal, v.creado_en
       from venta v
       join inventario i on i.id = v.producto_id
       where v.venta_id = $1
       order by v.id asc`,
      [id]
    );

    res.json({
      compra: compra.rows[0] ?? null,
      detalle: detalle.rows,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/compra/checkout
 * Body:
 * {
 *   "items": [{"producto_id": 2, "cantidad": 3}, ...]
 * }
 *
 * Crea un ticket en compra y sus líneas en venta.
 */
router.post("/checkout", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const items: Array<{ producto_id: number; cantidad: number }> = req.body?.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items es obligatorio y debe tener al menos 1 elemento" });
    }

    // Validación básica
    for (const it of items) {
      if (!Number.isFinite(it.producto_id) || !Number.isFinite(it.cantidad) || it.cantidad <= 0) {
        return res.status(400).json({ error: "Cada item debe tener producto_id y cantidad (>0)" });
      }
    }

    await client.query("begin");

    // 1) crear compra (total se actualiza al final)
    const compraInsert = await client.query(
      `insert into compra (total, fecha)
       values (0, now())
       returning id, total, fecha, creado_en`
    );
    const compraId = compraInsert.rows[0].id as number;

    // 2) traer precios desde inventario + calcular subtotales
    // (y opcionalmente validar stock)
    let total = 0;

    for (const it of items) {
      const inv = await client.query(
        `select id, tipo, precio, cantidad
         from inventario
         where id = $1`,
        [it.producto_id]
      );
      if (inv.rows.length === 0) throw new Error(`Producto no existe: ${it.producto_id}`);

      const precio = Number(inv.rows[0].precio) || 0;
      const stock = Number(inv.rows[0].cantidad) || 0;

      if (it.cantidad > stock) {
        throw new Error(`Stock insuficiente para producto ${it.producto_id}. Stock: ${stock}`);
      }

      const subtotal = precio * it.cantidad;
      total += subtotal;

      // insertar línea en venta
      await client.query(
        `insert into venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         values ($1, $2, $3, $4, $5)`,
        [compraId, it.producto_id, it.cantidad, precio, subtotal]
      );

      // restar stock (si ya usas trigger, esto sería duplicado; si NO tienes trigger, esto es necesario)
      await client.query(
        `update inventario
         set cantidad = cantidad - $1
         where id = $2`,
        [it.cantidad, it.producto_id]
      );
    }

    // 3) actualizar total compra
    const compraUpdate = await client.query(
      `update compra set total = $1 where id = $2
       returning id, total, fecha, creado_en`,
      [total, compraId]
    );

    await client.query("commit");

    res.status(201).json({
      compra: compraUpdate.rows[0],
      message: "Compra creada correctamente",
    });
  } catch (e) {
    await client.query("rollback");
    next(e);
  } finally {
    client.release();
  }
});

export default router;
