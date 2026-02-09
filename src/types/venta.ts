export interface Venta {
  id: string; // uuid
  usuarios_id: string | null; // uuid
  total: number;
  fecha: string | null; // timestamp
  nombre: string | null;
  email: string | null;
  creado_en: string | null; // timestamptz
}
