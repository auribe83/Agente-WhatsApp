import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function sendSlackNotification(payload: {
  type: "handover" | "appointment" | "test";
  title: string;
  fields?: Record<string, string>;
  url?: string;
}) {
  const config = await prisma.integrationConfig.findUnique({ where: { id: "slack" } });
  if (!config || !config.encryptedData || config.status !== "CONNECTED") {
    // Si no está conectada pero se especificó por variable de entorno de prueba
    const fallbackUrl = process.env.SLACK_WEBHOOK_URL;
    if (!fallbackUrl) return { skipped: true, reason: "Slack no conectado" };
  }

  let webhookUrl = process.env.SLACK_WEBHOOK_URL || "";
  if (config?.encryptedData) {
    try {
      webhookUrl = decrypt(config.encryptedData);
    } catch {}
  }

  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    throw new Error("URL del Webhook de Slack inválida.");
  }

  const color =
    payload.type === "handover" ? "#F59E0B" : payload.type === "appointment" ? "#10B981" : "#3B82F6";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: payload.title,
        emoji: true,
      },
    },
  ];

  if (payload.fields) {
    const fieldsArray = Object.entries(payload.fields).map(([k, v]) => ({
      type: "mrkdwn",
      text: `*${k}:*\n${v}`,
    }));
    blocks.push({
      type: "section",
      fields: fieldsArray,
    });
  }

  const appUrl = payload.url || process.env.APP_URL || "http://localhost:3000";
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "Ver en Atiende" },
        url: appUrl,
        style: "primary",
      },
    ],
  });

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachments: [{ color, blocks }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de Slack: ${err}`);
  }

  await prisma.activityLog.create({
    data: {
      channel: "slack",
      integration: "slack",
      action: "slack_notification",
      result: "SUCCESS",
      details: { type: payload.type, title: payload.title },
    },
  });

  return { success: true };
}
