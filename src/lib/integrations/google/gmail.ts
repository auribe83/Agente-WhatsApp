import { getValidAccessToken } from "./oauth";
import { prisma } from "@/lib/prisma";

function makeRawEmail(to: string, from: string, subject: string, bodyText: string): string {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyText,
  ].join("\r\n");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailMessage(options: {
  to: string;
  subject: string;
  body: string;
}) {
  const token = await getValidAccessToken("gmail");
  const config = await prisma.integrationConfig.findUnique({ where: { id: "gmail" } });
  const fromEmail = config?.accountEmail || "me";

  const raw = makeRawEmail(options.to, fromEmail, options.subject, options.body);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de Gmail al enviar correo: ${err}`);
  }

  const result = await res.json();

  await prisma.activityLog.create({
    data: {
      channel: "email",
      integration: "gmail",
      action: "send_email",
      result: "SUCCESS",
      details: { to: options.to, subject: options.subject, msgId: result.id },
    },
  });

  return result;
}

export async function sendDailySummaryEmail(ownerEmail: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [conversationsToday, appointmentsToday, waitingHuman] = await Promise.all([
    prisma.conversation.count({ where: { createdAt: { gte: today } } }),
    prisma.appointment.count({ where: { createdAt: { gte: today } } }),
    prisma.conversation.count({ where: { status: "WAITING_HUMAN" } }),
  ]);

  const subject = `Resumen Diario de Atención — ${new Date().toLocaleDateString("es-VE")}`;
  const body = `Hola,\n\nEste es el resumen automático de tu asistente virtual «Atiende» para el día de hoy:\n
• Conversaciones atendidas hoy: ${conversationsToday}
• Citas creadas por la IA: ${appointmentsToday}
• Conversaciones pendientes de atención por una persona: ${waitingHuman}
\nPuedes revisar todas las conversaciones y citas en el panel: ${process.env.APP_URL || "http://localhost:3000"}\n\nAtentamente,\nTu Asistente Virtual`;

  return sendGmailMessage({
    to: ownerEmail,
    subject,
    body,
  });
}
