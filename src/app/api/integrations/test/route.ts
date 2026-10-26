import { NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/integrations/slack";
import { dispatchWebhookEvent } from "@/lib/integrations/webhooks";
import { createStripePaymentLink } from "@/lib/integrations/stripe";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (id === "slack") {
      const result = await sendSlackNotification({
        type: "test",
        title: "🔔 Mensaje de Prueba desde Atiende",
        fields: {
          Negocio: "Clínica Dental Riky",
          Estado: "Conexión exitosa con Slack",
          Fecha: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" }),
        },
      });
      return NextResponse.json({ success: true, result });
    }

    if (id === "webhooks") {
      const result = await dispatchWebhookEvent("test.ping", {
        message: "Evento de prueba enviado desde Atiende",
        time: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, result });
    }

    if (id === "stripe") {
      const result = await createStripePaymentLink({
        amountUsd: 15,
        serviceName: "Prueba de Seña de Cita",
        clientName: "Paciente Prueba",
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Prueba no aplicable para esta integración" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al ejecutar prueba" }, { status: 500 });
  }
}
