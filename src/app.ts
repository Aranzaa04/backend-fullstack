import express from "express";
import cors from "cors";

import ventasRoutes from "./routes/ventas.routes";
import productoRoutes from "./routes/producto.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import detalleVentaRoutes from "./routes/detalle_venta.routes";

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
        ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
        : ["*"];

      // Permitir requests sin origin (Postman, navegador directo)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS bloqueado para el origen: ${origin}`)
      );
    },
    credentials: true,
  })
);

// =========================
// RUTAS API
// =========================
app.use("/api/ventas", ventasRoutes);
app.use("/api/producto", productoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/detalle_venta", detalleVentaRoutes);

// =========================
// RUTA BASE
// =========================
app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-only (backend)",
    endpoints: [
      "/api/ventas",
      "/api/producto",
      "/api/usuarios",
      "/api/detalle_venta",
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
// MANEJO DE ERRORES (AL FINAL)
// =========================
app.use(errorHandler);

export default app;
