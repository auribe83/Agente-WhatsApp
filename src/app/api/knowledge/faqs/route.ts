import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const faqs = await prisma.faqItem.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(faqs);
  } catch (error) {
    return NextResponse.json({ error: "Error al listar faqs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const faq = await prisma.faqItem.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || "General",
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
    return NextResponse.json({ success: true, faq });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear FAQ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const faq = await prisma.faqItem.update({
      where: { id: data.id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || "General",
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
    return NextResponse.json({ success: true, faq });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.faqItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar FAQ" }, { status: 500 });
  }
}
