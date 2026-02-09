import { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({
    error: "Error interno del servidor",
    detail: err?.message ?? String(err),
  });
}
