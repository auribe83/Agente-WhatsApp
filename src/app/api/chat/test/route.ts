import { NextResponse } from "next/server";
import { runAssistantConversation } from "@/lib/agent-runner";

export async function POST(request: Request) {
  try {
    const { messages, isSafeMode } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un mensaje en el historial." },
        { status: 400 }
      );
    }

    const response = await runAssistantConversation(messages, {
      isSafeMode: Boolean(isSafeMode),
      channel: "web",
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error en /api/chat/test:", error);
    return NextResponse.json(
      {
        error: "Ocurrió un error al procesar el mensaje con el asistente.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
