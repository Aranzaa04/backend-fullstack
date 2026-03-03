import { pool } from "../db/postgres";

export type Nota = {
  id: string;
  user_id: number;
  text: string;
  color: string;
  created_at: string;
  updated_at: string;
};

type NotaPayload = {
  text?: string;
  color?: string;
};

const DEFAULT_NOTE_COLOR = "#fce7f3";

export async function getNotas(userId: number) {
  const result = await pool.query(
    `SELECT id, text, color, created_at, updated_at
     FROM notas
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function createNota(userId: number, payload: NotaPayload) {
  const text = payload.text?.trim();
  const color = payload.color?.trim() || DEFAULT_NOTE_COLOR;

  const result = await pool.query(
    `INSERT INTO notas (user_id, text, color)
     VALUES ($1, $2, $3)
     RETURNING id, text, color, created_at, updated_at`,
    [userId, text, color]
  );

  return result.rows[0];
}

export async function updateNota(userId: number, noteId: string, payload: NotaPayload) {
  const text = payload.text?.trim();
  const color = payload.color?.trim();

  const result = await pool.query(
    `UPDATE notas
     SET text = COALESCE($1, text),
         color = COALESCE($2, color)
     WHERE id = $3 AND user_id = $4
     RETURNING id, text, color, created_at, updated_at`,
    [text ?? null, color ?? null, noteId, userId]
  );

  return result.rowCount ? result.rows[0] : null;
}

export async function deleteNota(userId: number, noteId: string) {
  const result = await pool.query(
    `DELETE FROM notas
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [noteId, userId]
  );

  return result.rowCount ? result.rows[0].id : null;
}
