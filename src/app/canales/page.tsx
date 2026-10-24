import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ChannelsView } from "@/components/canales/channels-view";

export const dynamic = "force-dynamic";

export default async function CanalesPage() {
  const [whatsapp, webchat] = await Promise.all([
    prisma.channelConfig.findUnique({ where: { id: "whatsapp" } }),
    prisma.channelConfig.findUnique({ where: { id: "webchat" } }),
  ]);

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Canales de Atención</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conecta WhatsApp mediante código QR y obtén el script para incrustar el chat en cualquier página web.
          </p>
        </div>

        <ChannelsView
          initialWhatsapp={JSON.parse(JSON.stringify(whatsapp))}
          initialWebchat={JSON.parse(JSON.stringify(webchat))}
          appUrl={appUrl}
        />
      </div>
    </DashboardShell>
  );
}
