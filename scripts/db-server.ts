import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve(process.cwd(), "prisma", "data", "pglite");
const PORT = 5433;

async function startDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  console.log(`[PGlite] Inicializando base de datos PostgreSQL local en ${DB_DIR}...`);
  const db = await PGlite.create({
    dataDir: DB_DIR,
  });

  const server = new PGLiteSocketServer({
    db,
    port: PORT,
    host: "127.0.0.1",
  });

  await server.start();
  console.log(`[PGlite] Servidor PostgreSQL local listo y escuchando en 127.0.0.1:${PORT}`);

  const shutdown = async () => {
    console.log("[PGlite] Apagando servidor...");
    await server.stop();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startDb().catch((err) => {
  console.error("[PGlite] Error al iniciar:", err);
  process.exit(1);
});
