import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const business = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });
    return NextResponse.json(business);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener datos del negocio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const updated = await prisma.businessSettings.upsert({
      where: { id: "default" },
      update: {
        name: data.name,
        description: data.description,
        address: data.address,
        phone: data.phone,
        website: data.website,
        freeTextInfo: data.freeTextInfo,
      },
      create: {
        id: "default",
        name: data.name,
        description: data.description,
        address: data.address,
        phone: data.phone,
        website: data.website,
        freeTextInfo: data.freeTextInfo,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar datos del negocio" }, { status: 500 });
  }
}
