import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    // Crear mensaje con senderType: AGENT
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "AGENT",
        content: content.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: "HUMAN_ACTIVE", // Al responder una persona, se activa modo humano automáticamente
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error al enviar mensaje como agente:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
