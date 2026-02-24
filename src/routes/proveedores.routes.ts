import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/proveedores
 * Lista proveedores
 */
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, marca, fecha_entrada, creado_en
       from proveedores
       order by id desc`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/proveedores/:id
 * Proveedor + sus entradas (y link a inventario)
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const proveedor = await pool.query(
      `select id, marca, fecha_entrada, creado_en
       from proveedores
       where id = $1`,
      [id]
    );

    if (!proveedor.rows[0]) return res.status(404).json({ error: "Proveedor no encontrado" });

    const entradas = await pool.query(
      `select ep.id,
              ep.proveedor_id,
              ep.inventario_id,
              ep.tipo,
              ep.peso,
              ep.cantidad,
              ep.creado_en,
              i.precio as inventario_precio,
              i.cantidad as inventario_stock
       from entrada_proveedor ep
       left join inventario i on i.id = ep.inventario_id
       where ep.proveedor_id = $1
       order by ep.id desc`,
      [id]
    );

    res.json({ proveedor: proveedor.rows[0], entradas: entradas.rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/proveedores
 * Body: { marca, fecha_entrada? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { marca, fecha_entrada } = req.body;

    if (!marca || typeof marca !== "string") {
      return res.status(400).json({ error: "marca es requerida (string)" });
    }

    const { rows } = await pool.query(
      `insert into proveedores (marca, fecha_entrada)
       values ($1, coalesce($2, now()))
       returning id, marca, fecha_entrada, creado_en`,
      [marca.trim(), fecha_entrada ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/proveedores/:id/entradas
 * Body:
 * {
 *   "items": [
 *     { "tipo": "Camisa", "peso": 0.3, "cantidad": 20 },
 *     { "tipo": "Pantalón", "cantidad": 10 }
 *   ]
 * }
 *
 * Inserta entradas en entrada_proveedor.
 * Tu TRIGGER en SQL:
 *  - crea/actualiza inventario
 *  - llena inventario_id automáticamente
 */
router.post("/:id/entradas", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const proveedorId = Number(req.params.id);
    if (!Number.isFinite(proveedorId)) return res.status(400).json({ error: "id inválido" });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items es requerido y debe tener al menos 1 elemento" });
    }

    // Validar que el proveedor exista
    const prov = await client.query(`select id from proveedores where id = $1`, [proveedorId]);
    if (!prov.rows[0]) return res.status(404).json({ error: "Proveedor no encontrado" });

    await client.query("begin");

    const inserted: any[] = [];

    for (const it of items) {
      const tipo = typeof it?.tipo === "string" ? it.tipo.trim() : "";
      const peso = it?.peso ?? null;
      const cantidad = Number(it?.cantidad);

      if (!tipo) {
        await client.query("rollback");
        return res.status(400).json({ error: "Cada item debe incluir tipo (string)" });
      }
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        await client.query("rollback");
        return res.status(400).json({ error: `Cantidad inválida para tipo=${tipo}` });
      }

      // OJO: inventario_id lo llena el trigger (BEFORE INSERT) y lo regresamos con RETURNING
      const r = await client.query(
        `insert into entrada_proveedor (proveedor_id, inventario_id, tipo, peso, cantidad)
         values ($1, null, $2, $3, $4)
         returning id, proveedor_id, inventario_id, tipo, peso, cantidad, creado_en`,
        [proveedorId, tipo, peso, cantidad]
      );

      inserted.push(r.rows[0]);
    }

    await client.query("commit");

    res.status(201).json({
      ok: true,
      proveedor_id: proveedorId,
      entradas: inserted,
      note: "Inventario se actualiza automáticamente por el trigger en Supabase",
    });
  } catch (e: any) {
    await client.query("rollback");

    // Si tu trigger falla, llega aquí (por ejemplo, constraints)
    res.status(400).json({ error: e?.message ?? "Error al insertar entradas" });
  } finally {
    client.release();
  }
});

export default router;