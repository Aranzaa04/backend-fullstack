import express from "express";
import cors from "cors";

// =========================
// RUTAS
// =========================
import authRoutes from "./routes/auth.routes";
import inventarioRoutes from "./routes/inventario.routes";
import compraRoutes from "./routes/compra.routes";       // tabla venta / detalle_venta
import ventaRoutes from "./routes/venta.routes";         // tabla compra / checkout
import productoRoutes from "./routes/producto.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import proveedoresRoutes from "./routes/proveedores.routes";

// =========================
// MIDDLEWARES
// =========================
import { logger } from "./middlewares/logger.middleware";
import { errorHandler } from "./middlewares/error.middleware";

// =========================
// APP
// =========================
const app = express();

// =========================
// MIDDLEWARES GLOBALES
// =========================
app.use(express.json());
app.use(logger);

// =========================
// CORS (para Vite / Frontend)
// =========================
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : ["*"];
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS bloqueado para el origen: ${origin}`));
    },
    credentials: true,
  })
);

// =========================
// RUTAS API
// =========================
app.use("/api/auth", authRoutes);              // autenticación
app.use("/api/inventario", inventarioRoutes); // productos disponibles
app.use("/api/compra", compraRoutes);         // tabla venta / detalle_venta
app.use("/api/venta", ventaRoutes);           // tabla compra / checkout
app.use("/api/producto", productoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/proveedores", proveedoresRoutes);

// =========================
// RUTA BASE
// =========================
app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-backend",
    endpoints: [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me",
      "/api/inventario",
      "/api/compra",
      "/api/compra/checkout",
      "/api/venta",
      "/api/producto",
      "/api/usuarios",
    ],
  });
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (_req, res) => res.json({ ok: true }));

// =========================
// 404
// =========================
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// =========================
// MANEJO DE ERRORES
// =========================
app.use(errorHandler);

export default app;
