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

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  })
);

// =========================
// RUTAS (API JSON)
// =========================
app.use("/api/ventas", ventasRoutes);
app.use("/api/producto", productoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/detalle_venta", detalleVentaRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-ready (backend only)",
    endpoints: [
      "/api/ventas",
      "/api/producto",
      "/api/usuarios",
      "/api/detalle_venta"
    ]
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// =========================
// MANEJO DE ERRORES (SIEMPRE AL FINAL)
// =========================
app.use(errorHandler);

export default app;
