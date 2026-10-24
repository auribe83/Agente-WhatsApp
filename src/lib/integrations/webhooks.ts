import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent =
  | "conversation.created"
  | "appointment.created"
  | "handover.triggered"
  | "contact.created"
  | "test.ping";

export async function dispatchWebhookEvent(event: WebhookEvent, payload: Record<string, any>) {
  const config = await prisma.integrationConfig.findUnique({ where: { id: "webhooks" } });

  if (!config || !config.isEnabled || config.status !== "CONNECTED") {
    return { skipped: true, reason: "Webhooks desactivados" };
  }

  const settings = (config.settings as Record<string, any>) || {};
  const targetUrl = settings.targetUrl;
  const subscribedEvents = (settings.events as string[]) || [];

  if (!targetUrl || (!subscribedEvents.includes(event) && event !== "test.ping")) {
    return { skipped: true, reason: "Evento no suscrito" };
  }

  const secret = settings.secret || process.env.WEBHOOK_SIGNING_SECRET || "atiende_secret";
  const timestamp = Math.floor(Date.now() / 1000);

  const bodyData = {
    event,
    timestamp,
    business: "Clínica Dental Lumen",
    data: payload,
  };

  const rawBody = JSON.stringify(bodyData);

  // Firma HMAC SHA-256
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Atiende-Signature": `t=${timestamp},v1=${signature}`,
        "X-Atiende-Event": event,
        "User-Agent": "Atiende-Webhook/1.0",
      },
      body: rawBody,
      signal: AbortSignal.timeout(6000),
    });

    const isSuccess = res.ok;

    await prisma.activityLog.create({
      data: {
        channel: "webhook",
        integration: "webhooks",
        action: `dispatch_${event}`,
        result: isSuccess ? "SUCCESS" : "ERROR",
        details: { targetUrl, event, statusCode: res.status },
      },
    });

    return { success: isSuccess, statusCode: res.status };
  } catch (err: any) {
    await prisma.activityLog.create({
      data: {
        channel: "webhook",
        integration: "webhooks",
        action: `dispatch_${event}`,
        result: "ERROR",
        details: { targetUrl, event, error: err.message },
      },
    });
    throw err;
  }
}
