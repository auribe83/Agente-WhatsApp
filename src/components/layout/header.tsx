"use client";

import { useState, useEffect } from "react";
import { Power, Sparkles, Clock, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  businessName: string;
  initialIsActive: boolean;
}

export function Header({ businessName, initialIsActive }: HeaderProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-VE", {
          timeZone: "America/Caracas",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = async () => {
    setIsUpdating(true);
    const newStatus = !isActive;
    try {
      const res = await fetch("/api/business/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setIsActive(newStatus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-800">{businessName}</h2>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <Clock className="w-3 h-3 text-slate-400" />
          {currentTime ? `${currentTime} Caracas` : "Caracas, Venezuela"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Interruptor General del Asistente */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/70 py-1.5 px-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-xs font-medium text-slate-700">
              {isActive ? "Asistente encendido" : "Asistente en pausa"}
            </span>
          </div>
          <button
            onClick={toggleStatus}
            disabled={isUpdating}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive
                ? "bg-slate-200/80 text-slate-700 hover:bg-slate-300"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <Power className="w-3 h-3" />
            {isActive ? "Pausar" : "Encender"}
          </button>
        </div>
      </div>
    </header>
  );
}
