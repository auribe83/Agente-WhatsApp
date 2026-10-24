import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // "take_control" | "return_to_bot"

    const newStatus = action === "take_control" ? "HUMAN_ACTIVE" : "BOT";

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: newStatus,
        waitingReason: action === "take_control" ? "Atendido por un agente humano" : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        channel: updated.channel,
        action: action === "take_control" ? "human_took_control" : "returned_to_assistant",
        result: "SUCCESS",
        details: { conversationId: id, status: newStatus },
      },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar control" }, { status: 500 });
  }
}
