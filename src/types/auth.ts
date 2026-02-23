export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  password?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginResponse {
  token: string;
  usuario: Omit<Usuario, 'password'>;
}

export interface JWTPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}
