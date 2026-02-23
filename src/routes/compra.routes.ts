import { Router } from "express";
import pool from "../db/postgres"; // Ajusta según tu configuración de pool

const router = Router();

// GET todas las compras
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM ventas ORDER BY creado_en DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST nueva compra + detalle
router.post("/", async (req, res) => {
  try {
    const { items } = req.body; // items = [{ producto_id, cantidad }]
    if (!items || !items.length) return res.status(400).json({ error: "No hay items" });

    // calcular total
    let total = 0;
    for (const item of items) {
      const { rows } = await pool.query(
        "SELECT precio FROM inventario WHERE id=$1",
        [item.producto_id]
      );
      if (!rows[0]) return res.status(400).json({ error: `Producto no encontrado: ${item.producto_id}` });
      total += rows[0].precio * item.cantidad;
    }

    // crear venta
    const { rows: ventaRows } = await pool.query(
      "INSERT INTO ventas(total) VALUES($1) RETURNING id",
      [total]
    );
    const ventaId = ventaRows[0].id;

    // insertar detalle_venta
    for (const item of items) {
      const { rows } = await pool.query("SELECT precio FROM inventario WHERE id=$1", [item.producto_id]);
      const precio_unitario = rows[0].precio;
      await pool.query(
        "INSERT INTO detalle_venta(venta_id, producto_id, cantidad, precio_unitario) VALUES($1,$2,$3,$4)",
        [ventaId, item.producto_id, item.cantidad, precio_unitario]
      );
    }

    res.status(201).json({ ok: true, ventaId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;