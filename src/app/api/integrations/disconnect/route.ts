import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const updated = await prisma.integrationConfig.update({
      where: { id },
      data: {
        isEnabled: false,
        status: "DISCONNECTED",
        encryptedData: null,
        accountEmail: null,
        lastError: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        integration: id,
        action: "disconnected",
        result: "SUCCESS",
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al desconectar integración" }, { status: 500 });
  }
}
