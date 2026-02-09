import { Router } from "express";
import { getDetalleVenta } from "../services/detalle_venta.service";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const detalle = await getDetalleVenta();
    res.json(detalle);
  } catch (err) {
    next(err);
  }
});

export default router;
