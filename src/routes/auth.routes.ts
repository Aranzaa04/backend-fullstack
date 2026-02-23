import { Router } from "express";
import { registerUsuario, loginUsuario, getUsuarioById } from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { LoginRequest, RegisterRequest } from "../types/auth";

const router = Router();

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 * Body: { email, password, nombre }
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, nombre } = req.body as RegisterRequest;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: "Email, contraseña y nombre son requeridos" });
    }

    const response = await registerUsuario({ email, password, nombre });
    return res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 * Body: { email, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const response = await loginUsuario({ email, password });
    return res.json(response);
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Error en login" });
  }
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado
 * Headers: Authorization: Bearer <token>
 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const usuario = await getUsuarioById(req.usuario!.id);
    return res.json(usuario);
  } catch (error: any) {
    next(error);
  }
});

export default router;
