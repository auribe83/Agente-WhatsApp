import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/integrations/google/oauth";
import { createOrGetContactsSheet } from "@/lib/integrations/google/sheets";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/integraciones?error=${encodeURIComponent(error || "Autorización cancelada")}`
    );
  }

  let service = "calendar";
  if (stateB64) {
    try {
      const stateObj = JSON.parse(Buffer.from(stateB64, "base64").toString("utf-8"));
      service = stateObj.service || "calendar";
    } catch {}
  }

  const integrationId =
    service === "gmail" ? "gmail" : service === "sheets" ? "google_sheets" : "google_calendar";

  try {
    const { tokens, accountEmail } = await exchangeCodeForTokens(code);

    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      scope: tokens.scope,
    };

    // Cifrar tokens con AES-256-GCM
    const encryptedData = encrypt(JSON.stringify(tokenData));

    await prisma.integrationConfig.upsert({
      where: { id: integrationId },
      update: {
        isEnabled: true,
        status: "CONNECTED",
        accountEmail,
        encryptedData,
        lastError: null,
      },
      create: {
        id: integrationId,
        isEnabled: true,
        status: "CONNECTED",
        accountEmail,
        encryptedData,
      },
    });

    // Si es Google Sheets, inicializamos la hoja de inmediato
    if (integrationId === "google_sheets") {
      try {
        await createOrGetContactsSheet();
      } catch (e) {
        console.warn("Hoja de Sheets se creará en el primer contacto:", e);
      }
    }

    await prisma.activityLog.create({
      data: {
        integration: integrationId,
        action: "oauth_connected",
        result: "SUCCESS",
        details: { accountEmail, service },
      },
    });

    return NextResponse.redirect(`${appUrl}/integraciones?connected=${integrationId}`);
  } catch (err: any) {
    console.error("Error en Google OAuth Callback:", err);
    return NextResponse.redirect(
      `${appUrl}/integraciones?error=${encodeURIComponent(err.message || "Error al procesar tokens")}`
    );
  }
}
