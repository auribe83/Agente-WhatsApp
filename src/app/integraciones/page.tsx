import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { INTEGRATIONS_CATALOG } from "@/lib/integrations/registry";
import { IntegrationsView } from "@/components/integraciones/integrations-view";
import { maskToken, decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function IntegracionesPage() {
  const dbConfigs = await prisma.integrationConfig.findMany();

  const integrations = INTEGRATIONS_CATALOG.map((def) => {
    const dbItem = dbConfigs.find((c) => c.id === def.id);
    let maskedCredential = "";

    if (dbItem?.encryptedData) {
      try {
        const decrypted = decrypt(dbItem.encryptedData);
        if (def.authType === "oauth_google") {
          maskedCredential = dbItem.accountEmail || "Conectada con Google";
        } else {
          maskedCredential = maskToken(decrypted);
        }
      } catch {
        maskedCredential = "••••••••";
      }
    }

    return {
      ...def,
      status: (dbItem?.status as any) || "DISCONNECTED",
      isEnabled: dbItem?.isEnabled ?? false,
      accountEmail: dbItem?.accountEmail || null,
      maskedCredential,
      settings: (dbItem?.settings as Record<string, any>) || {},
      capabilities: (dbItem?.capabilities as Record<string, boolean>) || def.defaultCapabilities,
      lastError: dbItem?.lastError || null,
    };
  });

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catálogo de Integraciones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conecta herramientas externas para dotar al asistente de capacidades y herramientas en tiempo real.
          </p>
        </div>

        <IntegrationsView initialIntegrations={JSON.parse(JSON.stringify(integrations))} />
      </div>
    </DashboardShell>
  );
}
