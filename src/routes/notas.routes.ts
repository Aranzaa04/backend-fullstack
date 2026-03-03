import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNota, deleteNota, getNotas, updateNota } from "../services/notas.service";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const notas = await getNotas(req.usuario!.id);
    return res.json(notas);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { text, color } = req.body as { text?: string; color?: string };

    if (!text?.trim()) {
      return res.status(400).json({ error: "El texto de la nota es requerido" });
    }

    const nota = await createNota(req.usuario!.id, { text, color });
    return res.status(201).json(nota);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { text, color } = req.body as { text?: string; color?: string };
    const noteId = req.params.id;

    if (typeof text === "string" && !text.trim()) {
      return res.status(400).json({ error: "El texto de la nota no puede estar vacío" });
    }

    if (typeof text !== "string" && typeof color !== "string") {
      return res.status(400).json({ error: "No hay cambios para actualizar" });
    }

    const nota = await updateNota(req.usuario!.id, noteId, { text, color });

    if (!nota) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    return res.json(nota);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedId = await deleteNota(req.usuario!.id, req.params.id);

    if (!deletedId) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    return res.json({ id: deletedId });
  } catch (error) {
    return next(error);
  }
});

export default router;
