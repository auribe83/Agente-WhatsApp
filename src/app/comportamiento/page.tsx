import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ComportamientoForm } from "@/components/comportamiento/comportamiento-form";

export const dynamic = "force-dynamic";

export default async function ComportamientoPage() {
  const behavior = await prisma.assistantBehavior.findUnique({
    where: { id: "default" },
  });

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Comportamiento del Asistente</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personaliza cómo habla tu asistente, su horario de atención y las reglas de escalado a personas.
          </p>
        </div>

        <ComportamientoForm initialData={behavior} />
      </div>
    </DashboardShell>
  );
}
