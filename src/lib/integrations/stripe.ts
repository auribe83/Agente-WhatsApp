import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function createStripePaymentLink(options: {
  amountUsd: number;
  serviceName: string;
  clientEmail?: string;
  clientName?: string;
}) {
  const config = await prisma.integrationConfig.findUnique({ where: { id: "stripe" } });

  let apiKey = process.env.STRIPE_RESTRICTED_KEY || "";
  if (config?.encryptedData) {
    try {
      apiKey = decrypt(config.encryptedData);
    } catch {}
  }

  if (!apiKey) {
    throw new Error("Stripe no está conectado. Configura tu Restricted API Key en Integraciones.");
  }

  const isTest = apiKey.includes("_test_");
  const amountCents = Math.round(options.amountUsd * 100);

  // Crear una sesión de Stripe Checkout usando API directa REST
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${process.env.APP_URL || "http://localhost:3000"}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${process.env.APP_URL || "http://localhost:3000"}/pago-cancelado`);
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", amountCents.toString());
  params.append("line_items[0][price_data][product_data][name]", `Seña / Reserva: ${options.serviceName}`);
  params.append("line_items[0][price_data][product_data][description]", `Anticipo de confirmación de cita para ${options.clientName || "el paciente"}`);
  params.append("line_items[0][quantity]", "1");

  if (options.clientEmail) {
    params.append("customer_email", options.clientEmail);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Error de Stripe: ${err.error?.message || JSON.stringify(err)}`);
  }

  const session = await res.json();

  await prisma.activityLog.create({
    data: {
      channel: "stripe",
      integration: "stripe",
      action: "create_payment_link",
      result: "SUCCESS",
      details: { amount: options.amountUsd, service: options.serviceName, url: session.url, isTest },
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
    isTest,
  };
}
