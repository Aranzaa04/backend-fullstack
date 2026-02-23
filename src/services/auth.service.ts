import { pool } from "../db/postgres";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Usuario, LoginRequest, RegisterRequest, LoginResponse, JWTPayload } from "../types/auth";

export type { JWTPayload };

const JWT_SECRET = process.env.JWT_SECRET || "tu_secret_key_super_secreto";
const SALT_ROUNDS = 10;

export async function registerUsuario(data: RegisterRequest): Promise<LoginResponse> {
  const { email, password, nombre } = data;

  // Validar que el email no exista
  const existingUser = await pool.query(
    "SELECT id FROM usuarios WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("El email ya está registrado");
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insertar usuario
  const result = await pool.query(
    "INSERT INTO usuarios (email, password, nombre) VALUES ($1, $2, $3) RETURNING id, email, nombre, creado_en, actualizado_en",
    [email, hashedPassword, nombre]
  );

  const usuario = result.rows[0] as Omit<Usuario, 'password'>;

  // Generar token JWT
  const token = generateToken(usuario.id, usuario.email);

  return { token, usuario };
}

export async function loginUsuario(data: LoginRequest): Promise<LoginResponse> {
  const { email, password } = data;

  // Buscar usuario por email
  const result = await pool.query(
    "SELECT id, email, nombre, password, creado_en, actualizado_en FROM usuarios WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Email o contraseña incorrectos");
  }

  const usuario = result.rows[0] as Usuario;

  // Verificar contraseña
  const passwordMatch = await bcrypt.compare(password, usuario.password!);

  if (!passwordMatch) {
    throw new Error("Email o contraseña incorrectos");
  }

  // Generar token JWT
  const token = generateToken(usuario.id, usuario.email);

  // Retornar sin la contraseña
  const { password: _, ...usuarioSinPassword } = usuario;

  return { token, usuario: usuarioSinPassword };
}

export function generateToken(id: number, email: string): string {
  const payload: JWTPayload = {
    id,
    email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error("Token inválido o expirado");
  }
}

export async function getUsuarioById(id: number): Promise<Omit<Usuario, 'password'>> {
  const result = await pool.query(
    "SELECT id, email, nombre, creado_en, actualizado_en FROM usuarios WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  return result.rows[0];
}
