import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { isEnabled, color, welcome } = await request.json();

    const updated = await prisma.channelConfig.upsert({
      where: { id: "webchat" },
      update: {
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        accountDetails: {
          color: color || "#2563eb",
          welcome: welcome || "¡Hola! ¿En qué podemos apoyarte hoy?",
        },
      },
      create: {
        id: "webchat",
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        accountDetails: {
          color: color || "#2563eb",
          welcome: welcome || "¡Hola! ¿En qué podemos apoyarte hoy?",
        },
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar ajustes del webchat" }, { status: 500 });
  }
}
