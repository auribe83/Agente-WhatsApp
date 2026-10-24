import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { isActive } = await request.json();
    const updated = await prisma.businessSettings.update({
      where: { id: "default" },
      data: { isActive: Boolean(isActive) },
    });
    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (error) {
    console.error("Error al actualizar estado del negocio:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
