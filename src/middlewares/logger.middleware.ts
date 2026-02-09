import { NextFunction, Request, Response } from "express";

export function logger(req: Request, _res: Response, next: NextFunction) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
}
