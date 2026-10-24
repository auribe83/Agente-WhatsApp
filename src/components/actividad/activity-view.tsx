"use client";

import { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  channel: string | null;
  integration: string | null;
  action: string;
  result: "SUCCESS" | "WARNING" | "ERROR" | string;
  details: any;
  createdAt: string;
}

interface ActivityViewProps {
  initialLogs: ActivityLogItem[];
}

export function ActivityView({ initialLogs }: ActivityViewProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs);
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [integrationFilter, setIntegrationFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (resultFilter !== "all" && log.result !== resultFilter) return false;
    if (integrationFilter !== "all" && log.integration !== integrationFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchChannel = log.channel?.toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchAction || matchChannel || matchDetails;
    }

    return true;
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Éxito
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Advertencia
          </span>
        );
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-red-600" />
            Error
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {result}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, paciente, error..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Filtro por Resultado */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Resultado:</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Todos</option>
              <option value="SUCCESS">Éxito</option>
              <option value="WARNING">Advertencia</option>
              <option value="ERROR">Error</option>
            </select>
          </div>

          {/* Filtro por Integración */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Integración:</span>
            <select
              value={integrationFilter}
              onChange={(e) => setIntegrationFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Todas</option>
              <option value="google_calendar">Google Calendar</option>
              <option value="gmail">Gmail</option>
              <option value="google_sheets">Google Sheets</option>
              <option value="slack">Slack</option>
              <option value="stripe">Stripe</option>
              <option value="webhooks">Webhooks</option>
              <option value="openrouter">OpenRouter / IA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No se encontraron eventos con los filtros seleccionados.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                          {log.integration || "Motor IA"}
                        </span>
                        {log.channel && (
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            [{log.channel}]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString("es-VE", {
                          timeZone: "America/Caracas",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getResultBadge(log.result)}
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Detalle JSON expandible */}
                {isExpanded && (
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto animate-fadeIn">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
