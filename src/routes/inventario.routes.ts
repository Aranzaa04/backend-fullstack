import { Router, Request, Response } from "express";
import {
  createInventario,
  deleteInventario,
  getInventario,
  getInventarioById,
  updateInventario,
} from "../services/inventario.service";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const rows = await getInventario();
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const row = await getInventarioById(id);
  if (!row) return res.status(404).json({ error: "Registro no encontrado" });

  res.json(row);
});

router.post("/", async (req: Request, res: Response) => {
  const created = await createInventario(req.body);
  res.status(201).json(created);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const updated = await updateInventario(id, req.body);
  if (!updated) return res.status(404).json({ error: "Registro no encontrado" });

  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const deletedId = await deleteInventario(id);
  if (deletedId === null) return res.status(404).json({ error: "Registro no encontrado" });

  res.json({ ok: true, deletedId });
});

export default router;
