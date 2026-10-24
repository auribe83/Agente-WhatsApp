import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  proto,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";
import { prisma } from "./prisma";
import { runAssistantConversation } from "./agent-runner";

let sock: ReturnType<typeof makeWASocket> | null = null;
const messageBuffers = new Map<string, { timer: NodeJS.Timeout; textParts: string[]; lastMsg: any }>();

export async function initWhatsAppWorker() {
  const sessionDir = path.resolve(
    process.cwd(),
    process.env.WHATSAPP_SESSION_DIR || "./data/whatsapp_session"
  );

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  console.log(`[WhatsApp] Inicializando sesión en ${sessionDir}...`);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }) as any,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
    browser: Browsers.macOS("Desktop"),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("[WhatsApp] Nuevo código QR generado. Actualizando en base de datos...");
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        await prisma.channelConfig.upsert({
          where: { id: "whatsapp" },
          update: {
            status: "WAITING_QR",
            qrCode: qrDataUrl,
          },
          create: {
            id: "whatsapp",
            status: "WAITING_QR",
            qrCode: qrDataUrl,
          },
        });
      } catch (err) {
        console.error("[WhatsApp] Error al convertir QR:", err);
      }
    }

    if (connection === "open") {
      const phoneNumber = sock?.user?.id?.split(":")[0] || sock?.user?.id?.split("@")[0] || "Desconocido";
      console.log(`[WhatsApp] ¡Conexión establecida con éxito! Número: +${phoneNumber}`);

      await prisma.channelConfig.upsert({
        where: { id: "whatsapp" },
        update: {
          status: "CONNECTED",
          qrCode: null,
          accountDetails: {
            phone: `+${phoneNumber}`,
            jid: sock?.user?.id,
          },
        },
        create: {
          id: "whatsapp",
          status: "CONNECTED",
          qrCode: null,
          accountDetails: {
            phone: `+${phoneNumber}`,
            jid: sock?.user?.id,
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          channel: "whatsapp",
          action: "whatsapp_connected",
          result: "SUCCESS",
          details: { phone: phoneNumber },
        },
      });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp] Conexión cerrada. Código: ${statusCode}. ¿Reconectar?: ${shouldReconnect}`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log("[WhatsApp] Sesión cerrada permanentemente. Limpiando credenciales...");
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch {}

        await prisma.channelConfig.update({
          where: { id: "whatsapp" },
          data: {
            status: "DISCONNECTED",
            qrCode: null,
            accountDetails: undefined,
          },
        });
      } else if (shouldReconnect) {
        console.log("[WhatsApp] Reconectando en 4 segundos...");
        setTimeout(() => initWhatsAppWorker(), 4000);
      }
    }
  });

  // Escuchar mensajes entrantes
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue; // Ignorar propios
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("broadcast")) continue; // Ignorar grupos y estados

      const cleanPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
      const whatsappLid = msg.key.participant || null;
      const contactName = msg.pushName || `Paciente +${cleanPhone}`;

      // Extraer contenido de texto o multimedia
      const isAudio = Boolean(msg.message.audioMessage);
      const isImage = Boolean(msg.message.imageMessage);
      const messageText =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        "";

      // 1. Obtener o crear Contacto y Conversación
      let contact = await prisma.contact.findFirst({
        where: { OR: [{ phone: `+${cleanPhone}` }, { whatsappLid: whatsappLid || undefined }] },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            phone: `+${cleanPhone}`,
            whatsappLid: whatsappLid || undefined,
            name: contactName,
            channel: "whatsapp",
          },
        });
      }

      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id, channel: "whatsapp" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            channel: "whatsapp",
            status: "BOT",
          },
        });
      }

      // Guardar el mensaje entrante
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "CONTACT",
          content: isAudio ? "[Mensaje de audio]" : isImage ? `[Imagen] ${messageText}` : messageText,
          isAudioOrMedia: isAudio || isImage,
          channelMsgId: msg.key.id,
        },
      });

      // Actualizar fecha del último mensaje
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // 2. Comprobar si el asistente responde
      const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
      if (!business?.isActive || conversation.status === "HUMAN_ACTIVE") {
        console.log(`[WhatsApp] Asistente apagado o conversación tomada por un humano. No se responde automáticamente.`);
        continue;
      }

      // 3. Manejo de audio o imágenes
      if (isAudio || isImage) {
        await sock?.sendMessage(remoteJid, {
          text: "¡Hola! Por el momento no puedo escuchar audios ni ver imágenes con detalle. Por favor, ¿podrías escribirme tu consulta por texto para apoyarte con todo gusto? He notificado a nuestro equipo por si deseas que un asesor te contacte.",
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            status: "WAITING_HUMAN",
            waitingReason: "Mensaje de audio o multimedia recibido",
          },
        });
        continue;
      }

      // 4. Buffer / Debounce de 8 segundos por si el usuario envía mensajes seguidos
      const existingBuffer = messageBuffers.get(remoteJid);
      if (existingBuffer) {
        clearTimeout(existingBuffer.timer);
        existingBuffer.textParts.push(messageText);
      } else {
        messageBuffers.set(remoteJid, {
          timer: setTimeout(() => processBufferedMessages(remoteJid, contact!.id, conversation!.id), 8000),
          textParts: [messageText],
          lastMsg: msg,
        });
      }
    }
  });
}

// Procesa los mensajes acumulados durante el buffer de 8 segundos
async function processBufferedMessages(remoteJid: string, contactId: string, conversationId: string) {
  const buffer = messageBuffers.get(remoteJid);
  messageBuffers.delete(remoteJid);
  if (!buffer || buffer.textParts.length === 0) return;

  const fullUserText = buffer.textParts.join(" ");

  try {
    // 1. Mostrar estado "escribiendo" (composing) en WhatsApp
    if (sock) {
      await sock.sendPresenceUpdate("composing", remoteJid);
    }

    // 2. Obtener historial reciente de la conversación
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedMessages = history.map((m) => ({
      role: m.senderType === "CONTACT" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    // 3. Ejecutar el Asistente IA (OpenRouter + Tools)
    const assistantResult = await runAssistantConversation(formattedMessages, {
      isSafeMode: false, // En WhatsApp los mensajes son reales
      contactId,
      conversationId,
      channel: "whatsapp",
    });

    // 4. Guardar respuesta en base de datos
    await prisma.message.create({
      data: {
        conversationId,
        senderType: "ASSISTANT",
        content: assistantResult.content,
        toolCalls: assistantResult.toolSteps as any,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // 5. Enviar mensaje por WhatsApp
    if (sock) {
      await sock.sendMessage(remoteJid, { text: assistantResult.content });
      await sock.sendPresenceUpdate("paused", remoteJid);
    }
  } catch (error) {
    console.error(`[WhatsApp] Error al responder a ${remoteJid}:`, error);
  }
}

// Desconexión forzada de WhatsApp
export async function disconnectWhatsAppSession() {
  console.log("[WhatsApp] Solicitud de desconexión recibida...");
  if (sock) {
    try {
      await sock.logout();
    } catch {}
    sock = null;
  }

  const sessionDir = path.resolve(
    process.cwd(),
    process.env.WHATSAPP_SESSION_DIR || "./data/whatsapp_session"
  );
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  } catch {}

  await prisma.channelConfig.upsert({
    where: { id: "whatsapp" },
    update: {
      status: "DISCONNECTED",
      qrCode: null,
      accountDetails: undefined,
    },
    create: {
      id: "whatsapp",
      status: "DISCONNECTED",
      qrCode: null,
    },
  });

  return { success: true };
}

// Solicitar código de vinculación de 8 dígitos para WhatsApp (alternativa a QR)
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<string> {
  if (!sock) {
    throw new Error("El servicio de WhatsApp se está iniciando en segundo plano. Espera unos segundos y vuelve a intentarlo.");
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error("El número de teléfono debe incluir código de país (ej. 584121234567)");
  }

  if (sock.user) {
    throw new Error("WhatsApp ya se encuentra vinculado a un número activo.");
  }

  try {
    const code = await sock.requestPairingCode(cleanPhone);
    return code;
  } catch (err: any) {
    console.error("[WhatsApp] Error al solicitar código de vinculación:", err);
    throw new Error(err?.message || "No se pudo generar el código con WhatsApp. Revisa el número ingresado.");
  }
}
