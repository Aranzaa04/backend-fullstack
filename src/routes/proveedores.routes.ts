import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/proveedores
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
 * Proveedor + entradas
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
      `select ep.id, ep.proveedor_id, ep.inventario_id, ep.tipo, ep.peso, ep.cantidad, ep.creado_en,
              i.precio as inventario_precio, i.cantidad as inventario_stock
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
 * ✅ SIN TRIGGERS:
 *  - crea/actualiza inventario
 *  - guarda entrada_proveedor con inventario_id
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

    // Validar proveedor
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

      // 1) Buscar si ya existe en inventario (por tipo + peso)
      const invSel = await client.query(
        `select id, cantidad, precio
         from inventario
         where tipo = $1 and (peso is not distinct from $2)
         limit 1`,
        [tipo, peso]
      );

      let inventarioId: number;

      if (invSel.rows[0]) {
        inventarioId = invSel.rows[0].id;

        // 2) Si existe: aumentar stock
        await client.query(
          `update inventario
           set cantidad = cantidad + $1
           where id = $2`,
          [cantidad, inventarioId]
        );
      } else {
        // 2) Si NO existe: crear producto en inventario
        // precio por defecto 0 (luego lo editas en inventario)
        const invIns = await client.query(
          `insert into inventario (tipo, peso, precio, cantidad)
           values ($1, $2, 0, $3)
           returning id`,
          [tipo, peso, cantidad]
        );
        inventarioId = invIns.rows[0].id;
      }

      // 3) Insertar entrada_proveedor con inventario_id
      const r = await client.query(
        `insert into entrada_proveedor (proveedor_id, inventario_id, tipo, peso, cantidad)
         values ($1, $2, $3, $4, $5)
         returning id, proveedor_id, inventario_id, tipo, peso, cantidad, creado_en`,
        [proveedorId, inventarioId, tipo, peso, cantidad]
      );

      inserted.push(r.rows[0]);
    }

    await client.query("commit");

    res.status(201).json({
      ok: true,
      proveedor_id: proveedorId,
      entradas: inserted,
      note: "Inventario fue actualizado desde el backend (sin triggers).",
    });
  } catch (e) {
    await client.query("rollback");
    next(e);
  } finally {
    client.release();
  }
});

export default router;