import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INTEGRATIONS_CATALOG } from "@/lib/integrations/registry";
import { maskToken, decrypt } from "@/lib/crypto";

export async function GET() {
  try {
    const dbConfigs = await prisma.integrationConfig.findMany();

    const result = INTEGRATIONS_CATALOG.map((def) => {
      const dbItem = dbConfigs.find((c) => c.id === def.id);
      let maskedCredential = "";

      if (dbItem?.encryptedData) {
        try {
          const decrypted = decrypt(dbItem.encryptedData);
          if (def.authType === "oauth_google") {
            maskedCredential = dbItem.accountEmail || "Conectada con Google";
          } else {
            maskedCredential = maskToken(decrypted);
          }
        } catch {
          maskedCredential = "••••••••";
        }
      }

      return {
        ...def,
        status: dbItem?.status || "DISCONNECTED",
        isEnabled: dbItem?.isEnabled ?? false,
        accountEmail: dbItem?.accountEmail || null,
        maskedCredential,
        settings: dbItem?.settings || {},
        capabilities: dbItem?.capabilities || def.defaultCapabilities,
        lastError: dbItem?.lastError || null,
      };
    });

    return NextResponse.json({ integrations: result });
  } catch (error) {
    return NextResponse.json({ error: "Error al listar integraciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, capabilities, settings } = await request.json();

    const updated = await prisma.integrationConfig.update({
      where: { id },
      data: {
        capabilities: capabilities || undefined,
        settings: settings || undefined,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
  }
}
