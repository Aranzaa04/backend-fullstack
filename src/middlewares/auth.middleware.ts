import { Request, Response, NextFunction } from "express";
import { verifyToken, type JWTPayload } from "../services/auth.service";

declare global {
  namespace Express {
    interface Request {
      usuario?: JWTPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    req.usuario = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Token inválido" });
  }
}
