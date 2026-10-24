import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Insertar orden para el worker
    await prisma.workerCommand.create({
      data: {
        command: "DISCONNECT_WHATSAPP",
      },
    });

    await prisma.channelConfig.upsert({
      where: { id: "whatsapp" },
      update: {
        status: "DISCONNECTED",
        qrCode: null,
        accountDetails: undefined,
      },
      create: {
        id: "whatsapp",
        status: "DISCONNECTED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al desconectar WhatsApp" }, { status: 500 });
  }
}
