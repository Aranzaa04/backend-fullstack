import { Router, Request, Response } from "express";
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
} from "../services/ventas.service";

const router = Router();

// GET /api/ventas
router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await getVentas();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ventas/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const venta = await getVentaById(req.params.id);
    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
    res.json(venta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ventas
router.post("/", async (req: Request, res: Response) => {
  try {
    const { usuario_id, total, fecha } = req.body;

    if (!usuario_id) return res.status(400).json({ error: "usuario_id es requerido" });
    if (total === undefined || total === null) return res.status(400).json({ error: "total es requerido" });

    const created = await createVenta({ usuario_id, total, fecha });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/ventas/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateVenta(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Venta no encontrada" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ventas/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await deleteVenta(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Venta no encontrada" });
    res.json({ ok: true, deletedId: deleted.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
