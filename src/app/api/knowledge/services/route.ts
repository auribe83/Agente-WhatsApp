import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Error al listar servicios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        durationMinutes: Number(data.durationMinutes) || 30,
        priceFrom: data.priceFrom !== null && data.priceFrom !== "" ? Number(data.priceFrom) : null,
        priceExact: data.priceExact !== null && data.priceExact !== "" ? Number(data.priceExact) : null,
        requiresEvaluation: Boolean(data.requiresEvaluation),
        stripeDepositAmount: data.stripeDepositAmount ? Number(data.stripeDepositAmount) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const service = await prisma.service.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        durationMinutes: Number(data.durationMinutes) || 30,
        priceFrom: data.priceFrom !== null && data.priceFrom !== "" ? Number(data.priceFrom) : null,
        priceExact: data.priceExact !== null && data.priceExact !== "" ? Number(data.priceExact) : null,
        requiresEvaluation: Boolean(data.requiresEvaluation),
        stripeDepositAmount: data.stripeDepositAmount ? Number(data.stripeDepositAmount) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
    return NextResponse.json({ success: true, service });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar servicio" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar servicio" }, { status: 500 });
  }
}
