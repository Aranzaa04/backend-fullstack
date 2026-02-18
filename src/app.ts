import express from "express";
import cors from "cors";

import inventarioRoutes from "./routes/inventario.routes";
import compraRoutes from "./routes/compra.routes";
import ventaRoutes from "./routes/venta.routes";

import { logger } from "./middlewares/logger.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// =========================
// MIDDLEWARES GLOBALES
// =========================
app.use(express.json());
app.use(logger);

// =========================
// CORS (CORRECTO PARA VITE)
// =========================
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : ["*"];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para el origen: ${origin}`));
    },
    credentials: true,
  })
);

// =========================
// RUTAS API
// =========================
app.use("/api/inventario", inventarioRoutes);

// TU CABECERA/TICKET
app.use("/api/compra", compraRoutes);

// TU DETALLE/LÍNEAS
app.use("/api/venta", ventaRoutes);

// =========================
// RUTA BASE
// =========================
app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-backend",
    endpoints: [
      "/api/inventario",
      "/api/compra",
      "/api/compra/checkout",
      "/api/venta",
    ],
  });
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// =========================
// 404
// =========================
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// =========================
// MANEJO DE ERRORES
// =========================
app.use(errorHandler);

export default app;
