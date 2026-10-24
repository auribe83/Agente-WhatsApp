import { prisma } from "../src/lib/prisma";
import {
  initWhatsAppWorker,
  disconnectWhatsAppSession,
  requestWhatsAppPairingCode,
} from "../src/lib/whatsapp-service";
import { sendDailySummaryEmail } from "../src/lib/integrations/google/gmail";

console.log("\n=======================================================");
console.log("   🟢 PROCESO WORKER INICIADO (WhatsApp + Tareas Cron)");
console.log("=======================================================\n");

async function main() {
  // 1. Inicializar Baileys WhatsApp
  try {
    await initWhatsAppWorker();
  } catch (err) {
    console.error("[Worker] Error al inicializar WhatsApp:", err);
  }

  // 2. Loop de tareas de fondo y comandos
  let lastCronCheck = Date.now();

  while (true) {
    try {
      // A. Procesar comandos pendientes de la base de datos
      const commands = await prisma.workerCommand.findMany({
        where: { isProcessed: false },
        take: 5,
      });

      for (const cmd of commands) {
        console.log(`[Worker] Procesando orden: ${cmd.command}`);
        if (cmd.command === "DISCONNECT_WHATSAPP") {
          await disconnectWhatsAppSession();
        }
        if (cmd.command === "RECONNECT_WHATSAPP") {
          await initWhatsAppWorker();
        }
        if (cmd.command === "PAIRING_CODE_REQUEST") {
          const payload = (cmd.payload as any) || {};
          const phone = payload.phone;
          console.log(`[Worker] Solicitando código de vinculación para teléfono: ${phone}`);
          try {
            const code = await requestWhatsAppPairingCode(phone);
            console.log(`[Worker] ¡Código de vinculación generado con éxito!: ${code}`);

            const current = await prisma.channelConfig.findUnique({ where: { id: "whatsapp" } });
            const currentDetails = (current?.accountDetails as any) || {};

            await prisma.channelConfig.upsert({
              where: { id: "whatsapp" },
              update: {
                accountDetails: {
                  ...currentDetails,
                  pairingCode: code,
                  pairingPhone: phone,
                  pairingError: null,
                },
              },
              create: {
                id: "whatsapp",
                status: "WAITING_QR",
                accountDetails: {
                  pairingCode: code,
                  pairingPhone: phone,
                },
              },
            });
          } catch (err: any) {
            console.error(`[Worker] Error generando pairing code:`, err.message);
            const current = await prisma.channelConfig.findUnique({ where: { id: "whatsapp" } });
            const currentDetails = (current?.accountDetails as any) || {};
            await prisma.channelConfig.update({
              where: { id: "whatsapp" },
              data: {
                accountDetails: {
                  ...currentDetails,
                  pairingCode: null,
                  pairingError: err.message,
                },
              },
            });
          }
        }
        if (cmd.command === "TRIGGER_DAILY_SUMMARY") {
          const adminEmail = process.env.ADMIN_EMAIL || "admin@atiende.local";
          try {
            await sendDailySummaryEmail(adminEmail);
          } catch (e) {
            console.warn("[Worker] Resumen por Gmail no enviado:", e);
          }
        }

        await prisma.workerCommand.update({
          where: { id: cmd.id },
          data: { isProcessed: true },
        });
      }

      // B. Comprobar Recordatorios de Citas (cada 10 minutos)
      const now = Date.now();
      if (now - lastCronCheck > 10 * 60 * 1000) {
        lastCronCheck = now;
        await checkAppointmentReminders();
      }
    } catch (e) {
      // Ignorar errores transitorios de polling
    }

    await new Promise((r) => setTimeout(r, 4000));
  }
}

// Recordatorio automático por WhatsApp el día antes de cada cita creada por el asistente
async function checkAppointmentReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: startOfTomorrow, lte: endOfTomorrow },
        status: "CONFIRMED",
        reminderSent: false,
      },
      include: { contact: true },
    });

    for (const appt of appointments) {
      console.log(`[Worker] Enviando recordatorio de cita a ${appt.contact.name} (${appt.contact.phone})...`);
      // Marcar como enviado
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true },
      });

      await prisma.activityLog.create({
        data: {
          channel: "whatsapp",
          action: "appointment_reminder_sent",
          result: "SUCCESS",
          details: { client: appt.contact.name, service: appt.serviceName },
        },
      });
    }
  } catch (err) {
    console.error("[Worker] Error en cron de recordatorios:", err);
  }
}

main().catch((err) => {
  console.error("[Worker] Error fatal:", err);
});
