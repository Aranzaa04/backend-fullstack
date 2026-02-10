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

// ✅ CORS BIEN CONFIGURADO
const allowedOrigins = (
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        // cuando despliegues tu frontend en Vercel, pon aquí tu dominio:
        // "https://frontend-aranza.vercel.app",
      ]
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sin origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// ✅ Para preflight requests
app.options("*", cors());

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
    endpoints: ["/api/ventas", "/api/producto", "/api/usuarios", "/api/detalle_venta"],
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
