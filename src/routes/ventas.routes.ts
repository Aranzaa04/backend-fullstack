import { Router } from "express";
import {
  getVentas,
  getVentaById,
  createVenta,
  deleteVenta,
  checkoutVenta,
} from "../services/ventas.service";

const router = Router();

// GET todas las ventas
router.get("/", async (_req, res, next) => {
  try {
    const data = await getVentas();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// GET venta por id
router.get("/:id", async (req, res, next) => {
  try {
    const data = await getVentaById(Number(req.params.id));
    if (!data) return res.status(404).json({ error: "Venta no encontrada" });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// ✅ CHECKOUT (carrito → venta + compra)
router.post("/checkout", async (req, res, next) => {
  try {
    const { items } = req.body as {
      items: { producto_id: number; cantidad: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items es obligatorio" });
    }

    const result = await checkoutVenta(items);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

// Crear venta directa (opcional)
router.post("/", async (req, res, next) => {
  try {
    const data = await createVenta(req.body);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

// Borrar venta
router.delete("/:id", async (req, res, next) => {
  try {
    const data = await deleteVenta(Number(req.params.id));
    if (!data) return res.status(404).json({ error: "Venta no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
