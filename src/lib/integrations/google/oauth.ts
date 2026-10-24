import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export const GOOGLE_SCOPES = {
  calendar: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  gmail: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  sheets: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
};

export function getGoogleOAuthClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/integrations/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(service: "calendar" | "gmail" | "sheets"): string {
  const { clientId, redirectUri } = getGoogleOAuthClientConfig();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID no está configurado en las variables de entorno.");
  }

  const scopes = GOOGLE_SCOPES[service] || [];
  const state = JSON.stringify({ service, timestamp: Date.now() });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent", // Obliga a devolver refresh_token
    include_granted_scopes: "true", // Autorización incremental de Google
    state: Buffer.from(state).toString("base64"),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthClientConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al canjear código con Google: ${errorText}`);
  }

  const tokens = await response.json();

  // Obtener correo de la cuenta conectada
  let accountEmail = "cuenta-google@ejemplo.com";
  if (tokens.access_token) {
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        if (userInfo.email) accountEmail = userInfo.email;
      }
    } catch {}
  }

  return { tokens, accountEmail };
}

// Obtener un access_token válido renovándolo si es necesario
export async function getValidAccessToken(integrationId: "google_calendar" | "gmail" | "google_sheets"): Promise<string> {
  const config = await prisma.integrationConfig.findUnique({
    where: { id: integrationId },
  });

  if (!config || !config.encryptedData) {
    throw new Error(`La integración ${integrationId} no está conectada.`);
  }

  let tokenData: any;
  try {
    const decrypted = decrypt(config.encryptedData);
    tokenData = JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`No se pudieron descifrar los tokens de ${integrationId}`);
  }

  const now = Date.now();
  // Si el access_token aún tiene más de 3 minutos de validez, úsalo
  if (tokenData.expires_at && tokenData.expires_at > now + 180000 && tokenData.access_token) {
    return tokenData.access_token;
  }

  // Si no hay refresh_token
  if (!tokenData.refresh_token) {
    throw new Error(`No hay refresh_token para renovar ${integrationId}. Se requiere reconectar.`);
  }

  // Renovar access_token usando el refresh_token
  const { clientId, clientSecret } = getGoogleOAuthClientConfig();

  try {
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      const err = await refreshRes.json();
      if (err.error === "invalid_grant") {
        // Token revocado por el usuario o caducado por modo de prueba
        await prisma.integrationConfig.update({
          where: { id: integrationId },
          data: {
            status: "ERROR",
            lastError: "El acceso fue revocado en la cuenta de Google o el token expiró. Por favor vuelve a conectar.",
          },
        });
        await prisma.activityLog.create({
          data: {
            integration: integrationId,
            action: "token_revoked",
            result: "ERROR",
            details: { error: "invalid_grant" },
          },
        });
      }
      throw new Error(`Google rechazo la renovación del token: ${err.error_description || err.error}`);
    }

    const newTokens = await refreshRes.json();
    const updatedData = {
      ...tokenData,
      access_token: newTokens.access_token,
      expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
    };

    // Guardar nuevo token cifrado
    await prisma.integrationConfig.update({
      where: { id: integrationId },
      data: {
        encryptedData: encrypt(JSON.stringify(updatedData)),
        status: "CONNECTED",
        lastError: null,
      },
    });

    return newTokens.access_token;
  } catch (err: any) {
    throw err;
  }
}
