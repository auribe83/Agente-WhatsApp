import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { id, credential, settings, capabilities } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID de integración requerido" }, { status: 400 });
    }

    let accountEmail: string | null = null;

    if (id === "slack") {
      if (!credential || !credential.startsWith("https://hooks.slack.com/")) {
        return NextResponse.json({ error: "La URL debe ser un Incoming Webhook de Slack válido" }, { status: 400 });
      }
      accountEmail = "Canal de Slack";
    } else if (id === "stripe") {
      if (!credential || (!credential.startsWith("rk_") && !credential.startsWith("sk_"))) {
        return NextResponse.json({ error: "La clave debe ser una Restricted Key de Stripe (comienza con rk_)" }, { status: 400 });
      }
      accountEmail = credential.includes("_test_") ? "Stripe (Modo de Prueba)" : "Stripe (Modo Real)";
    } else if (id === "webhooks") {
      if (!settings?.targetUrl || !settings.targetUrl.startsWith("http")) {
        return NextResponse.json({ error: "La URL del webhook debe ser válida (http/https)" }, { status: 400 });
      }
      accountEmail = new URL(settings.targetUrl).hostname;
    }

    // Cifrar credencial con AES-256-GCM
    const encryptedData = credential ? encrypt(credential) : undefined;

    const updated = await prisma.integrationConfig.upsert({
      where: { id },
      update: {
        isEnabled: true,
        status: "CONNECTED",
        accountEmail: accountEmail || undefined,
        encryptedData,
        settings: settings || undefined,
        capabilities: capabilities || undefined,
        lastError: null,
      },
      create: {
        id,
        isEnabled: true,
        status: "CONNECTED",
        accountEmail,
        encryptedData,
        settings: settings || undefined,
        capabilities: capabilities || undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        integration: id,
        action: "connected_manual",
        result: "SUCCESS",
        details: { accountEmail },
      },
    });

    return NextResponse.json({ success: true, integration: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al conectar integración" }, { status: 500 });
  }
}
