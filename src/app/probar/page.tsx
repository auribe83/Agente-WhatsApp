import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TestChat } from "@/components/probar/test-chat";

export const dynamic = "force-dynamic";

export default function ProbarPage() {
  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Probar Asistente</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactúa con el asistente con la configuración actual. A la derecha verás cada herramienta invocada con sus parámetros y respuesta en tiempo real.
          </p>
        </div>

        <TestChat />
      </div>
    </DashboardShell>
  );
}
