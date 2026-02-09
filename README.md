# express-aranza (Supabase + Express)

Endpoints:
- `/api/ventas`
- `/api/producto`

## Local
1) `npm install`
2) Crea `.env` (copia `.env.example`) y pon `DATABASE_URL`
3) `npm run dev`

## Vercel
En Vercel -> Settings -> Environment Variables:
- `DATABASE_URL`
- `PGSSLMODE` = `require`

Luego deploy.


## Nota (Backend only)
Este zip fue ajustado para que Express sea **solo backend JSON**.
- Ya no sirve páginas HTML.
- Endpoints: /api/usuarios, /api/producto, /api/ventas, /api/detalle_venta
- Root `/` devuelve info en JSON.
