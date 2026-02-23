import { Router } from "express";
import pool from "../db/postgres"; // tu pool de Postgres

const router = Router();

// GET todos los productos
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM inventario WHERE cantidad > 0 ORDER BY id ASC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;