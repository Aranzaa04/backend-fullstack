import { Router } from "express";
import { pool } from "../db/postgres";

const router = Router();

/**
 * GET /api/venta
 * GET /api/venta?venta_id=3
 */
router.get("/", async (req, res, next) => {
  try {
    const ventaId = req.query.venta_id ? Number(req.query.venta_id) : null;

    const { rows } = await pool.query(
      ventaId
        ? `select v.id, v.venta_id, v.producto_id, i.tipo, v.cantidad, v.precio_unitario, v.subtotal, v.creado_en
           from venta v
           join inventario i on i.id = v.producto_id
           where v.venta_id = $1
           order by v.id asc`
        : `select v.id, v.venta_id, v.producto_id, i.tipo, v.cantidad, v.precio_unitario, v.subtotal, v.creado_en
           from venta v
           join inventario i on i.id = v.producto_id
           order by v.id desc`,
      ventaId ? [ventaId] : []
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
