import { Router, Request, Response } from "express";
import {
  createProducto,
  deleteProducto,
  getProductoById,
  getProductos,
  updateProducto,
} from "../services/producto.service";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const rows = await getProductos();
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const producto = await getProductoById(id);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(producto);
});

router.post("/", async (req: Request, res: Response) => {
  const created = await createProducto(req.body);
  res.status(201).json(created);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const updated = await updateProducto(id, req.body);
  if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  const deletedId = await deleteProducto(id);
  if (deletedId === null) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ ok: true, deletedId });
});

export default router;
