import { Router } from "express";
import { getUsuarios } from "../services/usuarios.service";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const usuarios = await getUsuarios();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
});

export default router;
