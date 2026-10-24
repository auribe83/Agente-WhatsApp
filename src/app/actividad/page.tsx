import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ActivityView } from "@/components/actividad/activity-view";

export const dynamic = "force-dynamic";

export default async function ActividadPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registro de Actividad</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoría en tiempo real de cada llamada a herramientas, integraciones conectadas y eventos del asistente.
          </p>
        </div>

        <ActivityView initialLogs={JSON.parse(JSON.stringify(logs))} />
      </div>
    </DashboardShell>
  );
}
