import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [business, brand] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.agencyBrand.findUnique({ where: { id: "default" } }),
  ]);
  return NextResponse.json({ business, brand });
}

export async function POST(request: Request) {
  try {
    const { defaultAiModel, timezone, agencyName, logoUrl } = await request.json();

    if (defaultAiModel || timezone) {
      await prisma.businessSettings.update({
        where: { id: "default" },
        data: {
          defaultAiModel: defaultAiModel || undefined,
          timezone: timezone || undefined,
        },
      });
    }

    if (agencyName || logoUrl !== undefined) {
      await prisma.agencyBrand.upsert({
        where: { id: "default" },
        update: {
          name: agencyName || undefined,
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        },
        create: {
          id: "default",
          name: agencyName || "Atiende",
          logoUrl: logoUrl || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar ajustes" }, { status: 500 });
  }
}
