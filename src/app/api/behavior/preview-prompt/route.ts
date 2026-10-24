import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt-builder";

export async function GET() {
  try {
    const prompt = await buildSystemPrompt({
      name: "Juan Pérez (Ejemplo)",
      phone: "+58 412 1234567",
      channel: "whatsapp",
      upcomingAppointments: [],
    });
    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json({ error: "Error al generar el prompt" }, { status: 500 });
  }
}
