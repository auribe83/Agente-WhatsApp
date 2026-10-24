import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAssistantConversation } from "@/lib/agent-runner";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  try {
    const { message, sessionId, contactName, contactPhone } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const sid = sessionId || `web-anon-${Date.now()}`;

    // 1. Obtener o crear Contacto y Conversación
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: contactPhone || undefined },
          { id: sid.startsWith("usr-") ? sid : undefined },
        ],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: contactName || "Visitante Web",
          phone: contactPhone || null,
          channel: "web",
          metadata: { sessionId: sid },
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id, channel: "web" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          channel: "web",
          status: "BOT",
        },
      });
    }

    // Guardar mensaje entrante del cliente
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CONTACT",
        content: message,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // 2. Comprobar si el asistente está encendido y no tomado por humano
    const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
    if (!business?.isActive || conversation.status === "HUMAN_ACTIVE") {
      return NextResponse.json(
        {
          reply: "Gracias por tu mensaje. Nuestro equipo de asesores revisará tu solicitud y te contactará en breve.",
          status: conversation.status,
        },
        {
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 3. Obtener historial reciente
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedMessages = history.map((m) => ({
      role: m.senderType === "CONTACT" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    // 4. Ejecutar Asistente
    const result = await runAssistantConversation(formattedMessages, {
      isSafeMode: false,
      contactId: contact.id,
      conversationId: conversation.id,
      channel: "web",
    });

    // Guardar respuesta del asistente
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "ASSISTANT",
        content: result.content,
        toolCalls: result.toolSteps as any,
      },
    });

    return NextResponse.json(
      {
        reply: result.content,
        toolSteps: result.toolSteps,
        sessionId: contact.id,
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error: any) {
    console.error("Error en /api/chat/widget:", error);
    return NextResponse.json(
      { error: "Error al procesar mensaje" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
