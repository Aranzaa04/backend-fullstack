import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import inventarioRoutes from "./routes/inventario.routes";
import compraRoutes from "./routes/compra.routes";
import ventaRoutes from "./routes/venta.routes";
import productoRoutes from "./routes/producto.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import proveedoresRoutes from "./routes/proveedores.routes";

import loggerMiddleware from "./middlewares/logger.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "*")
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  })
);

app.use(loggerMiddleware);

// =========================
// RUTAS API
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/compra", compraRoutes);
app.use("/api/venta", ventaRoutes);

// Estas las puedes dejar si todavía las usas:
app.use("/api/producto", productoRoutes);
app.use("/api/usuarios", usuariosRoutes);

// ✅ NUEVA: proveedores
app.use("/api/proveedores", proveedoresRoutes);

// =========================
// RUTA BASE
// =========================
app.get("/", (_req, res) => {
  res.json({
    name: "express-aranza-backend",
    endpoints: [
      "/api/proveedores",
      "/api/proveedores/:id/entradas",
      "/api/inventario",
      "/api/compra",
      "/api/compra/checkout",
      "/api/venta",
      // si sigues usando auth/producto/usuarios:
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me",
      "/api/producto",
      "/api/usuarios",
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