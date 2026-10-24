import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const behavior = await prisma.assistantBehavior.findUnique({
      where: { id: "default" },
    });
    return NextResponse.json(behavior);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener comportamiento" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const updated = await prisma.assistantBehavior.upsert({
      where: { id: "default" },
      update: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        tone: data.tone,
        welcomeMessage: data.welcomeMessage,
        instructions: data.instructions,
        forbiddenRules: data.forbiddenRules,
        scheduleConfig: data.scheduleConfig,
        outOfHoursMode: data.outOfHoursMode,
        handoverTriggers: data.handoverTriggers,
      },
      create: {
        id: "default",
        name: data.name,
        avatarUrl: data.avatarUrl,
        tone: data.tone,
        welcomeMessage: data.welcomeMessage,
        instructions: data.instructions,
        forbiddenRules: data.forbiddenRules,
        scheduleConfig: data.scheduleConfig,
        outOfHoursMode: data.outOfHoursMode,
        handoverTriggers: data.handoverTriggers,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error al guardar comportamiento:", error);
    return NextResponse.json({ error: "Error al guardar comportamiento" }, { status: 500 });
  }
}
