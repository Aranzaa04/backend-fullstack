import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/inventario
 * Opcional: ?all=1 (incluye cantidad 0)
 */
router.get("/", async (req, res, next) => {
  try {
    const all = req.query.all === "1";

    const { rows } = await pool.query(
      all
        ? `select * from inventario order by id asc`
        : `select * from inventario where cantidad > 0 order by id asc`
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/inventario/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const { rows } = await pool.query(`select * from inventario where id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/inventario
 * Body: { tipo, peso?, precio?, cantidad? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { tipo, peso, precio, cantidad } = req.body;

    if (!tipo || typeof tipo !== "string") {
      return res.status(400).json({ error: "tipo es requerido (string)" });
    }

    const precioNum = precio === undefined ? 0 : Number(precio);
    const cantidadNum = cantidad === undefined ? 0 : Number(cantidad);

    if (!Number.isFinite(precioNum) || precioNum < 0) {
      return res.status(400).json({ error: "precio inválido" });
    }
    if (!Number.isFinite(cantidadNum) || cantidadNum < 0) {
      return res.status(400).json({ error: "cantidad inválida" });
    }

    const { rows } = await pool.query(
      `insert into inventario (tipo, peso, precio, cantidad)
       values ($1, $2, $3, $4)
       returning *`,
      [tipo.trim(), peso ?? null, precioNum, cantidadNum]
    );

    res.status(201).json(rows[0]);
  } catch (e: any) {
    // si tipo es unique, aquí puede tronar por duplicado
    res.status(400).json({ error: e?.message ?? "Error creando producto" });
  }
});

/**
 * PUT /api/inventario/:id
 * Body: { tipo?, peso?, precio?, cantidad? }
 */
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const fields = ["tipo", "peso", "precio", "cantidad"] as const;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(f === "tipo" ? String(req.body[f]).trim() : req.body[f]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(id);

    const { rows } = await pool.query(
      `update inventario
       set ${updates.join(", ")}
       where id = $${idx}
       returning *`,
      values
    );

    if (!rows[0]) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Error actualizando inventario" });
  }
});

/**
 * DELETE /api/inventario/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    const { rowCount } = await pool.query(`delete from inventario where id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;