import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/integrations/google/oauth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = (searchParams.get("service") || "calendar") as "calendar" | "gmail" | "sheets";

    if (!["calendar", "gmail", "sheets"].includes(service)) {
      return NextResponse.json({ error: "Servicio de Google inválido." }, { status: 400 });
    }

    const authUrl = buildGoogleAuthUrl(service);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Error al generar enlace de autorización con Google.",
        hint: "Asegúrate de configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env",
      },
      { status: 500 }
    );
  }
}
