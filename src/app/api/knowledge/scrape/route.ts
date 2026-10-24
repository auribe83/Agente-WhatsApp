import { NextResponse } from "next/server";
import { scrapeAndExtractFromWeb } from "@/lib/web-scraper";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Por favor introduce una URL válida (http/https)" }, { status: 400 });
    }

    const data = await scrapeAndExtractFromWeb(url);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al importar desde web:", error);
    return NextResponse.json({ error: "No se pudo procesar la página web" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Guarda los elementos seleccionados por el usuario
    const { selectedServices, selectedFaqs, businessInfo } = await request.json();

    if (businessInfo) {
      await prisma.businessSettings.update({
        where: { id: "default" },
        data: {
          name: businessInfo.name || undefined,
          description: businessInfo.description || undefined,
          phone: businessInfo.phone || undefined,
          address: businessInfo.address || undefined,
        },
      });
    }

    if (Array.isArray(selectedServices)) {
      for (const s of selectedServices) {
        await prisma.service.create({
          data: {
            name: s.name,
            description: s.description || "",
            durationMinutes: Number(s.durationMinutes) || 30,
            priceFrom: s.priceFrom !== null && s.priceFrom !== "" ? Number(s.priceFrom) : null,
            priceExact: s.priceExact !== null && s.priceExact !== "" ? Number(s.priceExact) : null,
            requiresEvaluation: Boolean(s.requiresEvaluation),
          },
        });
      }
    }

    if (Array.isArray(selectedFaqs)) {
      for (const f of selectedFaqs) {
        await prisma.faqItem.create({
          data: {
            question: f.question,
            answer: f.answer,
            category: f.category || "General",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar los datos importados" }, { status: 500 });
  }
}
