import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { AjustesView } from "@/components/ajustes/ajustes-view";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const [business, brand, users] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.agencyBrand.findUnique({ where: { id: "default" } }),
    prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ajustes del Sistema</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configura el modelo de IA de OpenRouter, estimación de costes, marca de agencia y equipo de trabajo.
          </p>
        </div>

        <AjustesView
          initialBusiness={business}
          initialBrand={brand}
          initialUsers={JSON.parse(JSON.stringify(users))}
        />
      </div>
    </DashboardShell>
  );
}
