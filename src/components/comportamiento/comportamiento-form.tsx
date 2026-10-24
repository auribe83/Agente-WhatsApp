"use client";

import { useState } from "react";
import {
  Bot,
  Save,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  X,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

interface ScheduleDay {
  day: string;
  enabled: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

interface HandoverTriggers {
  complaint: boolean;
  urgent: boolean;
  human_requested: boolean;
  unknown_answer: boolean;
  customRule: string;
}

interface ComportamientoFormProps {
  initialData: any;
}

export function ComportamientoForm({ initialData }: ComportamientoFormProps) {
  const [name, setName] = useState(initialData?.name || "Lumen Asistente");
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || "");
  const [tone, setTone] = useState(initialData?.tone || "cercano");
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialData?.welcomeMessage ||
      "¡Hola! Te damos la bienvenida a Clínica Dental Lumen. ¿En qué podemos ayudarte hoy?"
  );
  const [instructions, setInstructions] = useState(initialData?.instructions || "");
  const [forbiddenRules, setForbiddenRules] = useState(initialData?.forbiddenRules || "");
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleDay[]>(
    initialData?.scheduleConfig || [
      { day: "Lunes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
      { day: "Martes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
      { day: "Miércoles", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
      { day: "Jueves", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
      { day: "Viernes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
      { day: "Sábado", enabled: false, morningStart: "09:00", morningEnd: "13:00", afternoonStart: "", afternoonEnd: "" },
      { day: "Domingo", enabled: false, morningStart: "", morningEnd: "", afternoonStart: "", afternoonEnd: "" },
    ]
  );
  const [outOfHoursMode, setOutOfHoursMode] = useState(initialData?.outOfHoursMode || "take_appointment");
  const [handoverTriggers, setHandoverTriggers] = useState<HandoverTriggers>(
    initialData?.handoverTriggers || {
      complaint: true,
      urgent: true,
      human_requested: true,
      unknown_answer: true,
      customRule: "",
    }
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [fullPrompt, setFullPrompt] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleScheduleChange = (index: number, field: keyof ScheduleDay, value: any) => {
    const updated = [...scheduleConfig];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleConfig(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl,
          tone,
          welcomeMessage,
          instructions,
          forbiddenRules,
          scheduleConfig,
          outOfHoursMode,
          handoverTriggers,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Hubo un problema al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPromptModal = async () => {
    setPromptModalOpen(true);
    setLoadingPrompt(true);
    try {
      const res = await fetch("/api/behavior/preview-prompt");
      const data = await res.json();
      setFullPrompt(data.prompt || "No disponible");
    } catch {
      setFullPrompt("Error al cargar el prompt");
    } finally {
      setLoadingPrompt(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 1. Identidad y Tono */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          Identidad y Tono de Voz
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre del Asistente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="Ej. Lumen Asistente"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              URL del Avatar (opcional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="https://ejemplo.com/avatar.png"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Tono de Comunicación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "cercano", title: "Cercano", desc: "Empático, cálido y tuteo cordial venezolano" },
              { id: "profesional", title: "Profesional", desc: "Formal, riguroso, cortés y respetuoso" },
              { id: "directo", title: "Directo", desc: "Breve, conciso y enfocado en la solución rápida" },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                  tone === t.id
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{t.title}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      tone === t.id ? "border-blue-600 bg-blue-600" : "border-slate-300"
                    }`}
                  >
                    {tone === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mensaje de Bienvenida Inicial
          </label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            placeholder="Mensaje con el que saludará al cliente..."
            required
          />
        </div>
      </div>

      {/* 2. Instrucciones y Reglas Infranqueables */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Instrucciones y Límites
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Instrucciones Libres para el Asistente
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Explica cómo debe desenvolverse, qué destacar y cómo orientar a los pacientes de la clínica.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            placeholder="Instrucciones detalladas de atención..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cosas que NUNCA debe hacer (Reglas Infranqueables)
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Límites estrictos que el modelo respetará sin excepción (una por línea).
          </p>
          <textarea
            value={forbiddenRules}
            onChange={(e) => setForbiddenRules(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2 text-sm bg-red-50/30 border border-red-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-900 font-mono text-xs"
            placeholder="1. NUNCA dar diagnósticos médicos o recetas..."
          />
        </div>
      </div>

      {/* 3. Horarios de Atención y Fuera de Horario */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Horario de Atención Comercial (Zona Horaria Caracas)
        </h2>

        <div className="space-y-2.5">
          {scheduleConfig.map((item, index) => (
            <div
              key={item.day}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                item.enabled ? "bg-slate-50 border-slate-200" : "bg-slate-100/50 border-slate-200/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 w-32">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => handleScheduleChange(index, "enabled", e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">{item.day}</span>
              </div>

              {item.enabled ? (
                <div className="flex flex-wrap items-center gap-2 text-slate-600">
                  <span className="text-[11px] text-slate-400">Mañana:</span>
                  <input
                    type="time"
                    value={item.morningStart}
                    onChange={(e) => handleScheduleChange(index, "morningStart", e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={item.morningEnd}
                    onChange={(e) => handleScheduleChange(index, "morningEnd", e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />

                  <span className="text-[11px] text-slate-400 ml-2">Tarde:</span>
                  <input
                    type="time"
                    value={item.afternoonStart}
                    onChange={(e) => handleScheduleChange(index, "afternoonStart", e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={item.afternoonEnd}
                    onChange={(e) => handleScheduleChange(index, "afternoonEnd", e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              ) : (
                <span className="text-slate-400 italic">Cerrado</span>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            ¿Qué hace el asistente fuera del horario de atención?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setOutOfHoursMode("take_appointment")}
              className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                outOfHoursMode === "take_appointment"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-bold text-slate-900">Seguir atendiendo y agendar citas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Responde preguntas y permite que el cliente agende para los días y horas hábiles.
              </p>
            </div>

            <div
              onClick={() => setOutOfHoursMode("take_note")}
              className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                outOfHoursMode === "take_note"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-bold text-slate-900">Solo tomar el recado</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Informa que la clínica está cerrada y toma los datos del paciente para que el equipo lo contacte.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Traspaso a una Persona (Handover) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-violet-600" />
          Cuándo pasar la conversación a una persona del equipo
        </h2>
        <p className="text-xs text-slate-500">
          Cuando se cumpla alguna de estas condiciones, el asistente pausará sus respuestas en esa conversación y avisará al equipo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { key: "complaint", label: "Queja o reclamo del cliente" },
            { key: "urgent", label: "Urgencia médica o emergencia declarada" },
            { key: "human_requested", label: "El cliente pide explícitamente hablar con alguien" },
            { key: "unknown_answer", label: "El asistente no conoce la respuesta con certeza" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer text-xs font-medium text-slate-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={(handoverTriggers as any)[item.key]}
                onChange={(e) =>
                  setHandoverTriggers({
                    ...handoverTriggers,
                    [item.key]: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {item.label}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Regla adicional de escalado (opcional)
          </label>
          <input
            type="text"
            value={handoverTriggers.customRule || ""}
            onChange={(e) =>
              setHandoverTriggers({
                ...handoverTriggers,
                customRule: e.target.value,
              })
            }
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            placeholder="Ej: Si mencionan dolor severo o sangrado continuo..."
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleOpenPromptModal}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          Ver el prompt completo
        </button>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              ¡Guardado exitosamente!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Modal: Ver el Prompt Completo */}
      {promptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Prompt Completo del Sistema</h3>
                <p className="text-[11px] text-slate-500">
                  Este es el texto exacto generado dinámicamente que recibe el modelo de IA en cada interacción.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPromptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed selection:bg-blue-600 selection:text-white">
              {loadingPrompt ? (
                <div className="text-slate-400">Generando vista previa del prompt...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{fullPrompt}</pre>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Solo lectura · Se recalcula con cada cambio en Conocimiento o Ajustes
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copiado al portapapeles
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Prompt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
