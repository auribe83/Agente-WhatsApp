import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { InboxView } from "@/components/conversaciones/inbox-view";

export const dynamic = "force-dynamic";

export default async function ConversacionesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bandeja de Conversaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisa los chats en vivo de WhatsApp y Web. Toma el control en cualquier momento para hablar como miembro del equipo.
          </p>
        </div>

        <InboxView initialConversations={JSON.parse(JSON.stringify(conversations))} />
      </div>
    </DashboardShell>
  );
}
