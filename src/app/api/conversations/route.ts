import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (filter === "needs_attention") {
      where.status = "WAITING_HUMAN";
    } else if (filter === "whatsapp") {
      where.channel = "whatsapp";
    } else if (filter === "web") {
      where.channel = "web";
    }

    if (search.trim()) {
      where.OR = [
        { contact: { name: { contains: search, mode: "insensitive" } } },
        { contact: { phone: { contains: search, mode: "insensitive" } } },
        { messages: { some: { content: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error al listar conversaciones:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
