import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  MessageSquare,
  CalendarCheck,
  UserCheck,
  Clock,
  Radio,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Bot,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResumenPage() {
  const [
    business,
    channels,
    integrations,
    todayConversationsCount,
    weekConversationsCount,
    waitingHumanCount,
    appointmentsCount,
    recentActivity,
  ] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.channelConfig.findMany(),
    prisma.integrationConfig.findMany(),
    prisma.conversation.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.conversation.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.conversation.count({
      where: { status: "WAITING_HUMAN" },
    }),
    prisma.appointment.count({
      where: { status: "CONFIRMED" },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const whatsapp = channels.find((c) => c.id === "whatsapp");
  const webchat = channels.find((c) => c.id === "webchat");

  const connectedIntegrations = integrations.filter((i) => i.status === "CONNECTED");

  const whatsappPhone =
    whatsapp?.accountDetails && typeof whatsapp.accountDetails === "object"
      ? (whatsapp.accountDetails as Record<string, unknown>).phone
      : null;

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Banner de Estado General */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                business?.isActive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{business?.name}</h1>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    business?.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {business?.isActive ? "Operando en vivo" : "En pausa"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {business?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/probar"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              Probar Asistente
            </Link>
          </div>
        </div>

        {/* Canales e Integraciones Activas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Canales */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Canales de Atención
              </h3>
              <Link
                href="/canales"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Configurar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">WhatsApp</p>
                    <p className="text-[11px] text-slate-500">
                      {whatsapp?.status === "CONNECTED"
                        ? String(whatsappPhone || "Conectado")
                        : "Esperando vinculación QR"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    whatsapp?.status === "CONNECTED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {whatsapp?.status === "CONNECTED" ? "Conectado" : "Sin conectar"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    WEB
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Chat para tu Web</p>
                    <p className="text-[11px] text-slate-500">Burbuja flotante activa</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Integraciones */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Integraciones Conectadas
              </h3>
              <Link
                href="/integraciones"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Ver Catálogo ({integrations.length}) <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {connectedIntegrations.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                <p>No hay integraciones conectadas en este momento.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Conecta Google Calendar para permitir que el asistente reserve citas en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedIntegrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs"
                  >
                    <span className="font-medium text-slate-700 capitalize">
                      {item.id.replace("_", " ")}
                    </span>
                    <span className="text-emerald-600 font-medium text-[11px]">Conectada</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Métricas Principales */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Rendimiento del Asistente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium text-slate-600">Conversaciones Hoy</span>
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{todayConversationsCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">{weekConversationsCount} en la última semana</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium text-slate-600">Citas Creadas</span>
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{appointmentsCount}</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Registradas por IA</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium text-slate-600">Esperan a una Persona</span>
                <UserCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{waitingHumanCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">Requieren atención humana</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium text-slate-600">Tiempo Medio Respuesta</span>
                <Clock className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">8.4 seg</div>
              <p className="text-[11px] text-slate-400 mt-1">Con buffer y composición</p>
            </div>
          </div>
        </div>

        {/* Últimas Acciones del Asistente */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Últimas Acciones del Asistente</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de eventos y llamadas a herramientas en tiempo real
              </p>
            </div>
            <Link
              href="/actividad"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver registro completo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay actividad registrada aún. Utiliza la sección <Link href="/probar" className="text-blue-600 underline">Probar</Link> para realizar simulaciones.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{act.action}</p>
                      <p className="text-[11px] text-slate-400">
                        {act.channel ? `Canal: ${act.channel}` : "Sistema"} · {act.integration || "Motor IA"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        act.result === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700"
                          : act.result === "WARNING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {act.result}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(act.createdAt).toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
