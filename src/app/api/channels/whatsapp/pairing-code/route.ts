import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Por favor introduce un número de teléfono válido." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        {
          error:
            "El número debe incluir el código de país sin el símbolo + (ej. 584121234567 para Venezuela).",
        },
        { status: 400 }
      );
    }

    // Inicializar estado en accountDetails
    const current = await prisma.channelConfig.findUnique({ where: { id: "whatsapp" } });
    const currentDetails = (current?.accountDetails as any) || {};

    await prisma.channelConfig.upsert({
      where: { id: "whatsapp" },
      update: {
        accountDetails: {
          ...currentDetails,
          pairingCode: "GENERATING",
          pairingPhone: cleanPhone,
          pairingError: null,
        },
      },
      create: {
        id: "whatsapp",
        status: "WAITING_QR",
        accountDetails: {
          pairingCode: "GENERATING",
          pairingPhone: cleanPhone,
        },
      },
    });

    // Enviar orden al worker
    await prisma.workerCommand.create({
      data: {
        command: "PAIRING_CODE_REQUEST",
        payload: { phone: cleanPhone },
      },
    });

    return NextResponse.json({ success: true, phone: cleanPhone });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al solicitar código" },
      { status: 500 }
    );
  }
}
