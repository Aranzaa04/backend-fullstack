import express from "express";
import cors from "cors";

// ===== RUTAS =====
import ventaRoutes from "./routes/ventas.routes";      // maneja tabla: venta
import productoRoutes from "./routes/producto.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import inventarioRoutes from "./routes/inventario.routes";

// ===== MIDDLEWARES =====
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
app.use("/api/venta", ventaRoutes);        // ✅ venta + checkout
app.use("/api/producto", productoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/inventario", inventarioRoutes);

// =========================
// RUTA BASE
// =========================
app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-backend",
    endpoints: [
      "/api/venta",
      "/api/venta/checkout",
      "/api/producto",
      "/api/usuarios",
      "/api/inventario",
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
// 404 (OPCIONAL PERO ÚTIL)
// =========================
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// =========================
// MANEJO DE ERRORES (AL FINAL)
// =========================
app.use(errorHandler);

export default app;
