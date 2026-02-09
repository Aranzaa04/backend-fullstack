import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

// En Vercel no se usa listen(). En local sí.
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Servidor local en http://localhost:${PORT}`);
  });
}

export default app;
