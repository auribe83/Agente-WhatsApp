import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ConocimientoView } from "@/components/conocimiento/conocimiento-view";

export const dynamic = "force-dynamic";

export default async function ConocimientoPage() {
  const [business, services, faqs] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.service.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.faqItem.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base de Conocimiento</h1>
          <p className="text-xs text-slate-500 mt-1">
            Toda la información de tu negocio que el asistente utiliza para responder dudas y agendar citas.
          </p>
        </div>

        <ConocimientoView
          initialBusiness={business}
          initialServices={JSON.parse(JSON.stringify(services))}
          initialFaqs={JSON.parse(JSON.stringify(faqs))}
        />
      </div>
    </DashboardShell>
  );
}
