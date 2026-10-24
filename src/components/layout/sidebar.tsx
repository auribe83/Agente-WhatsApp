"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  Blocks,
  Radio,
  PlayCircle,
  MessageSquare,
  Activity,
  Settings,
  Bot,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const navigationItems = [
  { name: "Resumen", href: "/", icon: LayoutDashboard },
  { name: "Comportamiento", href: "/comportamiento", icon: BrainCircuit },
  { name: "Conocimiento", href: "/conocimiento", icon: BookOpen },
  { name: "Integraciones", href: "/integraciones", icon: Blocks },
  { name: "Canales", href: "/canales", icon: Radio },
  { name: "Probar", href: "/probar", icon: PlayCircle, highlight: true },
  { name: "Conversaciones", href: "/conversaciones", icon: MessageSquare },
  { name: "Actividad", href: "/actividad", icon: Activity },
  { name: "Ajustes", href: "/ajustes", icon: Settings },
];

interface SidebarProps {
  agencyName?: string;
  userName?: string;
}

export function Sidebar({ agencyName = "Atiende", userName = "Administrador" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-slate-900 leading-tight text-base">{agencyName}</div>
          <div className="text-[11px] font-medium text-slate-400">Asistente de IA</div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menú Principal
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              } ${item.highlight && !isActive ? "text-blue-600 font-medium" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-blue-600" : item.highlight ? "text-blue-500" : "text-slate-400"
                }`}
              />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Enlaces Rápidos
        </div>
        <Link
          href="/demo"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            Web de Demostración
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">/demo</span>
        </Link>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] text-slate-400">Caracas (UTC-4)</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar Sesión"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
