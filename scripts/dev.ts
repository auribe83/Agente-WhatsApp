import { spawn } from "child_process";
import net from "net";
import path from "path";
import fs from "fs";

const DB_PORT = 5433;

function isPortOpen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("   🚀 INICIANDO ATIENDE - ASISTENTE DE IA");
  console.log("=======================================================\n");

  const runningProcesses: any[] = [];

  const cleanup = () => {
    console.log("\n[Dev] Deteniendo procesos...");
    runningProcesses.forEach((p) => {
      try {
        p.kill();
      } catch {}
    });
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Asegurar directorio de base de datos
  const dbDir = path.resolve(process.cwd(), "prisma", "data", "pglite");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 1. Arrancar Servidor PostgreSQL PGlite con multiplexer para 20 conexiones concurrentes
  const dbAlreadyRunning = await isPortOpen(DB_PORT);
  if (!dbAlreadyRunning) {
    console.log("[Dev] 1/3 Arrancando base de datos PostgreSQL local (PGlite con soporte concurrente)...");
    const dbProcess = spawn("npx", ["pglite-server", "--db=./prisma/data/pglite", `--port=${DB_PORT}`, "-m", "20"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });
    runningProcesses.push(dbProcess);

    // Esperar a que el puerto responda
    let retries = 30;
    while (retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isPortOpen(DB_PORT)) break;
      retries--;
    }
    console.log("[Dev] PostgreSQL listo en el puerto 5433.");
  } else {
    console.log("[Dev] 1/3 Base de datos PostgreSQL ya escuchando en el puerto 5433.");
  }

  // 2. Sincronizar esquema de Prisma y Datos Iniciales
  console.log("[Dev] 2/3 Sincronizando esquema de base de datos...");
  await new Promise<void>((resolve, reject) => {
    const push = spawn("npx", ["prisma", "db", "push"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });
    push.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`prisma db push falló con código ${code}`));
    });
  });

  // Ejecutar seed
  console.log("[Dev] Verificando datos iniciales (Clínica Dental Lumen)...");
  await new Promise<void>((resolve) => {
    const seed = spawn("npx", ["tsx", "prisma/seed.ts"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });
    seed.on("close", () => resolve());
  });

  // 3. Arrancar Worker en segundo plano
  console.log("[Dev] 3/3 Arrancando proceso de fondo (worker)...");
  const workerProcess = spawn("npx", ["tsx", "scripts/worker.ts"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });
  runningProcesses.push(workerProcess);

  // 4. Arrancar Next.js Web
  console.log("\n[Dev] ✨ Todo listo. Levantando servidor Next.js en http://localhost:3000 ...\n");
  const nextProcess = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });
  runningProcesses.push(nextProcess);
}

main().catch((err) => {
  console.error("[Dev] Error fatal:", err);
  process.exit(1);
});
