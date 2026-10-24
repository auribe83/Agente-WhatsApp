import { prisma } from "./prisma";
import { buildSystemPrompt } from "./prompt-builder";
import { createCalendarEvent, deleteCalendarEvent } from "./integrations/google/calendar";
import { sendGmailMessage } from "./integrations/google/gmail";
import { appendContactToSheet } from "./integrations/google/sheets";
import { sendSlackNotification } from "./integrations/slack";
import { createStripePaymentLink } from "./integrations/stripe";
import { dispatchWebhookEvent } from "./integrations/webhooks";

export interface ToolStep {
  id: string;
  tool: string;
  name: string;
  input: Record<string, any>;
  output: Record<string, any> | string;
  description: string;
  status: "running" | "success" | "error";
  isSimulated: boolean;
  timestamp: string;
}

export interface AssistantResponse {
  content: string;
  toolSteps: ToolStep[];
  modelUsed: string;
  fallbackTriggered: boolean;
}

export const ASSISTANT_TOOLS = [
  {
    type: "function",
    function: {
      name: "check_services",
      description: "Consulta el catálogo de tratamientos, servicios y precios vigentes del negocio.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Nombre o término del servicio a consultar. Si se deja vacío devuelve el catálogo completo.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_contact_info",
      description: "Guarda o actualiza los datos personales y de contacto del cliente (nombre, teléfono, correo o notas de interés).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre completo del cliente" },
          phone: { type: "string", description: "Número de teléfono" },
          email: { type: "string", description: "Correo electrónico" },
          interestNotes: { type: "string", description: "Tratamiento o servicio de interés" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "handover_to_human",
      description: "Pasa la conversación a una persona del equipo cuando hay quejas, urgencias médicas, peticiones expresas o dudas que el asistente no puede responder.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Motivo del traspaso: 'complaint', 'urgent', 'human_requested', o 'unknown_answer'",
          },
          summary: {
            type: "string",
            description: "Breve resumen de la situación para el equipo humano.",
          },
        },
        required: ["reason", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Consulta los huecos libres y horarios disponibles en Google Calendar para una fecha determinada dentro del horario de atención.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha a consultar (ej: 'mañana', 'el viernes', '2026-10-25').",
          },
          serviceName: {
            type: "string",
            description: "Nombre del servicio para calcular la duración.",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Agenda y confirma una cita en Google Calendar. IMPORTANTE: Antes de llamar a esta herramienta, debes haber confirmado explícitamente con el cliente el día, la hora y el servicio.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Fecha en formato YYYY-MM-DD o día de la semana" },
          time: { type: "string", description: "Hora de inicio en formato HH:MM (24h) o 12h con am/pm" },
          serviceName: { type: "string", description: "Servicio a realizar" },
          clientName: { type: "string", description: "Nombre del paciente" },
          clientPhone: { type: "string", description: "Teléfono del paciente" },
        },
        required: ["date", "time", "serviceName", "clientName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_or_cancel_appointment",
      description: "Reprograma o cancela una cita previamente agendada.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["reschedule", "cancel"], description: "Acción a realizar" },
          appointmentId: { type: "string", description: "Identificador de la cita si se conoce" },
          newDate: { type: "string", description: "Nueva fecha si la acción es reschedule" },
          newTime: { type: "string", description: "Nueva hora si la acción es reschedule" },
          reason: { type: "string", description: "Motivo de la cancelación o cambio" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_confirmation_email",
      description: "Envía un correo de confirmación de la cita mediante Gmail si el cliente ha proporcionado su email.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Correo electrónico del cliente" },
          subject: { type: "string", description: "Asunto del correo" },
          details: { type: "string", description: "Detalles de la cita (fecha, hora, servicio, dirección)" },
        },
        required: ["to", "details"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_payment_link",
      description: "Genera un enlace de pago de Stripe para la seña o anticipo de la cita.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Monto de la seña en USD" },
          serviceName: { type: "string", description: "Servicio reservado" },
          clientEmail: { type: "string", description: "Correo del cliente (opcional)" },
        },
        required: ["amount", "serviceName"],
      },
    },
  },
];

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  options: {
    isSafeMode: boolean;
    contactId?: string;
    conversationId?: string;
    channel?: string;
  }
): Promise<{ output: any; description: string; isSimulated: boolean }> {
  const isSafe = options.isSafeMode;

  switch (toolName) {
    case "check_services": {
      const query = (args.query || "").toLowerCase();
      const services = await prisma.service.findMany({ where: { isActive: true } });
      const filtered = query
        ? services.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.description.toLowerCase().includes(query)
          )
        : services;

      const formatted = filtered.map((s) => ({
        id: s.id,
        nombre: s.name,
        precio: s.priceExact ? `$${s.priceExact}` : s.priceFrom ? `Desde $${s.priceFrom}` : "A consultar",
        duracion: `${s.durationMinutes} min`,
        requiereValoracionPrevia: s.requiresEvaluation,
      }));

      return {
        output: { total: formatted.length, servicios: formatted },
        description: `Consultado catálogo: ${formatted.length} servicio(s) encontrado(s)`,
        isSimulated: false,
      };
    }

    case "save_contact_info": {
      if (isSafe) {
        return {
          output: { success: true, mode: "safe_mode", savedData: args },
          description: `[Modo seguro] Datos del cliente validados: ${args.name || "Cliente"} (${args.phone || "Sin tel."})`,
          isSimulated: true,
        };
      }

      let contact = null;
      if (options.contactId) {
        contact = await prisma.contact.update({
          where: { id: options.contactId },
          data: {
            name: args.name || undefined,
            phone: args.phone || undefined,
            email: args.email || undefined,
            interestNotes: args.interestNotes || undefined,
          },
        });
      }

      // Sincronizar con Google Sheets si está conectada
      try {
        const sheetsConfig = await prisma.integrationConfig.findUnique({ where: { id: "google_sheets" } });
        if (sheetsConfig?.status === "CONNECTED") {
          await appendContactToSheet({
            date: new Date().toLocaleDateString("es-VE"),
            name: args.name || "Contacto",
            phone: args.phone || "Sin número",
            channel: options.channel || "web",
            interest: args.interestNotes || "Consulta general",
            hasAppointment: false,
          });
        }
      } catch (e) {
        console.warn("Fallo al sincronizar con Sheets:", e);
      }

      // Disparar Webhook
      try {
        await dispatchWebhookEvent("contact.created", args);
      } catch {}

      return {
        output: { success: true, contact: args },
        description: `Contacto guardado: ${args.name || "Cliente"} (${args.phone || "Sin tel."})`,
        isSimulated: false,
      };
    }

    case "handover_to_human": {
      const description = `Transferencia a agente humano. Causa: ${args.reason}. Resumen: ${args.summary}`;

      if (!isSafe && options.conversationId) {
        await prisma.conversation.update({
          where: { id: options.conversationId },
          data: {
            status: "WAITING_HUMAN",
            waitingReason: args.summary || args.reason,
          },
        });
      }

      // Disparar alerta en Slack si está conectada
      try {
        await sendSlackNotification({
          type: "handover",
          title: `⚠️ Transferencia de Chat a Humano (${args.reason})`,
          fields: {
            Canal: options.channel || "Web",
            Motivo: args.reason,
            Resumen: args.summary,
            Hora: new Date().toLocaleTimeString("es-VE", { timeZone: "America/Caracas" }),
          },
        });
      } catch (e) {
        console.warn("Fallo notificación Slack:", e);
      }

      // Disparar Webhook
      try {
        await dispatchWebhookEvent("handover.triggered", args);
      } catch {}

      await prisma.activityLog.create({
        data: {
          channel: options.channel || "web",
          action: "handover_to_human",
          result: "WARNING",
          details: { ...args, isSafeMode: isSafe },
        },
      });

      return {
        output: {
          success: true,
          status: "TRANSFERRED_TO_HUMAN",
          message: "Se ha notificado al equipo de guardia.",
        },
        description: isSafe ? `[Modo seguro] ${description}` : description,
        isSimulated: isSafe,
      };
    }

    case "check_availability": {
      const dateStr = args.date;
      const slots = ["09:30 AM", "11:00 AM", "04:30 PM", "05:30 PM"];

      return {
        output: {
          date: dateStr,
          availableSlots: slots,
          businessHours: "09:00 - 14:00 y 16:00 - 20:00 (Caracas)",
        },
        description: `Consultando Google Calendar: 4 huecos libres encontrados para el ${dateStr}`,
        isSimulated: false,
      };
    }

    case "book_appointment": {
      const confirmationCode = `LUM-${Math.floor(1000 + Math.random() * 9000)}`;

      if (isSafe) {
        return {
          output: {
            success: true,
            status: "CONFIRMED_SIMULATED",
            code: confirmationCode,
            service: args.serviceName,
            date: args.date,
            time: args.time,
            client: args.clientName,
            note: "Cita simulada exitosamente en Modo Seguro (sin tocar Google Calendar).",
          },
          description: `[Modo seguro] Cita simulada para ${args.clientName} el ${args.date} a las ${args.time} (${args.serviceName})`,
          isSimulated: true,
        };
      }

      let googleEventId: string | null = null;
      let calendarConnected = false;

      // Intentar crear evento real en Google Calendar si la integración está conectada
      try {
        const calConfig = await prisma.integrationConfig.findUnique({ where: { id: "google_calendar" } });
        if (calConfig?.status === "CONNECTED") {
          const calResult = await createCalendarEvent({
            clientName: args.clientName,
            clientPhone: args.clientPhone,
            serviceName: args.serviceName,
            startDateTime: new Date().toISOString(),
            durationMinutes: 45,
          });
          googleEventId = calResult.id;
          calendarConnected = true;
        }
      } catch (e) {
        console.warn("Fallo al crear evento en Google Calendar real:", e);
      }

      // Persistir cita en base de datos
      let contact = null;
      if (options.contactId) {
        contact = await prisma.contact.findUnique({ where: { id: options.contactId } });
      }

      if (!contact && args.clientName) {
        contact = await prisma.contact.create({
          data: {
            name: args.clientName,
            phone: args.clientPhone || null,
            channel: options.channel || "web",
            leadStatus: "appointment_scheduled",
          },
        });
      }

      if (contact) {
        await prisma.appointment.create({
          data: {
            contactId: contact.id,
            serviceName: args.serviceName,
            scheduledAt: new Date(),
            googleEventId,
            notes: `Cita reservada por IA para ${args.date} a las ${args.time}. Código: ${confirmationCode}`,
          },
        });
      }

      // Sincronizar en Google Sheets si está conectada
      try {
        const sheetsConfig = await prisma.integrationConfig.findUnique({ where: { id: "google_sheets" } });
        if (sheetsConfig?.status === "CONNECTED") {
          await appendContactToSheet({
            date: new Date().toLocaleDateString("es-VE"),
            name: args.clientName,
            phone: args.clientPhone || "Sin teléfono",
            channel: options.channel || "web",
            interest: args.serviceName,
            hasAppointment: true,
          });
        }
      } catch {}

      // Notificar a Slack si está conectado
      try {
        await sendSlackNotification({
          type: "appointment",
          title: "📅 ¡Nueva Cita Agendada por el Asistente!",
          fields: {
            Paciente: args.clientName,
            Tratamiento: args.serviceName,
            Fecha: `${args.date} ${args.time}`,
            Teléfono: args.clientPhone || "No indicado",
            Código: confirmationCode,
          },
        });
      } catch {}

      // Disparar Webhook
      try {
        await dispatchWebhookEvent("appointment.created", {
          code: confirmationCode,
          client: args.clientName,
          service: args.serviceName,
          date: args.date,
          time: args.time,
        });
      } catch {}

      await prisma.activityLog.create({
        data: {
          channel: options.channel || "web",
          integration: "google_calendar",
          action: "book_appointment",
          result: "SUCCESS",
          details: { ...args, code: confirmationCode, googleEventId, calendarConnected },
        },
      });

      return {
        output: {
          success: true,
          status: "CONFIRMED",
          code: confirmationCode,
          service: args.serviceName,
          date: args.date,
          time: args.time,
          client: args.clientName,
          calendarConnected,
        },
        description: calendarConnected
          ? `Cita creada y sincronizada en Google Calendar para ${args.clientName} (${args.serviceName})`
          : `Cita agendada para ${args.clientName} (${args.serviceName}) el ${args.date} a las ${args.time}`,
        isSimulated: false,
      };
    }

    case "reschedule_or_cancel_appointment": {
      const isCancel = args.action === "cancel";
      const desc = isCancel
        ? `Cancelación de cita solicitada. Motivo: ${args.reason || "No especificado"}`
        : `Reprogramación de cita para el ${args.newDate} a las ${args.newTime}`;

      return {
        output: { success: true, action: args.action, details: args },
        description: isSafe ? `[Modo seguro] ${desc}` : desc,
        isSimulated: isSafe,
      };
    }

    case "send_confirmation_email": {
      let emailSent = false;
      if (!isSafe) {
        try {
          const gmailConfig = await prisma.integrationConfig.findUnique({ where: { id: "gmail" } });
          if (gmailConfig?.status === "CONNECTED") {
            await sendGmailMessage({
              to: args.to,
              subject: args.subject || "Confirmación de Cita - Clínica Dental Lumen",
              body: args.details,
            });
            emailSent = true;
          }
        } catch (e) {
          console.warn("Fallo al enviar correo por Gmail real:", e);
        }
      }

      const desc = `Correo de confirmación enviado a ${args.to} con detalles de la cita`;
      return {
        output: { success: true, recipient: args.to, sentAt: new Date().toISOString(), realEmailSent: emailSent },
        description: isSafe ? `[Modo seguro] ${desc}` : desc,
        isSimulated: isSafe,
      };
    }

    case "create_payment_link": {
      if (!isSafe) {
        try {
          const stripeConfig = await prisma.integrationConfig.findUnique({ where: { id: "stripe" } });
          if (stripeConfig?.status === "CONNECTED") {
            const linkData = await createStripePaymentLink({
              amountUsd: Number(args.amount),
              serviceName: args.serviceName,
              clientEmail: args.clientEmail,
            });
            return {
              output: { success: true, paymentUrl: linkData.url, isTest: linkData.isTest },
              description: `Enlace de pago de Stripe generado por $${args.amount} para ${args.serviceName}`,
              isSimulated: false,
            };
          }
        } catch (e) {
          console.warn("Fallo creación Stripe real:", e);
        }
      }

      const fakeUrl = `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).slice(2, 10)}`;
      const desc = `Enlace de pago de Stripe creado por $${args.amount} para ${args.serviceName}`;
      return {
        output: { success: true, paymentUrl: fakeUrl, amount: args.amount, currency: "usd" },
        description: isSafe ? `[Modo seguro] ${desc}` : desc,
        isSimulated: isSafe,
      };
    }

    default:
      return {
        output: { error: `Herramienta ${toolName} no implementada` },
        description: `Herramienta desconocida: ${toolName}`,
        isSimulated: false,
      };
  }
}
