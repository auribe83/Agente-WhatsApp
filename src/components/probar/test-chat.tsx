"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Shield,
  ShieldAlert,
  Bot,
  User,
  Zap,
  Calendar,
  Mail,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolSteps?: ToolStep[];
}

interface ToolStep {
  id: string;
  tool: string;
  name: string;
  input: Record<string, any>;
  output: Record<string, any> | string;
  description: string;
  status: "running" | "success" | "error";
  isSimulated: boolean;
  timestamp: string;
}

export function TestChat() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "¡Hola! Te damos la bienvenida a Clínica Dental Lumen en Chacao. ¿En qué podemos apoyarte hoy con tu sonrisa?",
      timestamp: "Justo ahora",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSafeMode, setIsSafeMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [timelineSteps, setTimelineSteps] = useState<ToolStep[]>([]);
  const [modelUsed, setModelUsed] = useState<string>("anthropic/claude-haiku-5.5");
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timelineSteps]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          isSafeMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al comunicarse con el asistente.");
      }

      const botMsg: MessageItem = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        toolSteps: data.toolSteps,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.toolSteps && data.toolSteps.length > 0) {
        setTimelineSteps((prev) => [...prev, ...data.toolSteps]);
        // Expandir por defecto el último para destacarlo en vídeo
        setExpandedStepId(data.toolSteps[data.toolSteps.length - 1].id);
      }

      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Disculpa, ocurrió un error en la simulación: ${err.message}`,
          timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        role: "assistant",
        content:
          "¡Hola! Te damos la bienvenida a Clínica Dental Lumen en Chacao. ¿En qué podemos apoyarte hoy con tu sonrisa?",
        timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setTimelineSteps([]);
    setExpandedStepId(null);
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "book_appointment":
      case "check_availability":
      case "reschedule_or_cancel_appointment":
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case "send_confirmation_email":
        return <Mail className="w-4 h-4 text-sky-500" />;
      case "create_payment_link":
        return <CreditCard className="w-4 h-4 text-violet-500" />;
      case "handover_to_human":
        return <UserCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <Zap className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Control Superior */}
      <div className="bg-white border border-slate-200/80 rounded-2xl px-6 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">Simulador de Pruebas</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-600 font-mono">
            <Cpu className="w-3 h-3 text-slate-400" />
            {modelUsed}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Interruptor Modo Seguro */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              {isSafeMode ? (
                <Shield className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              )}
              <span className="text-xs font-semibold text-slate-800">
                Modo Seguro {isSafeMode ? "Activado" : "Desactivado"}
              </span>
            </div>

            <button
              onClick={() => setIsSafeMode(!isSafeMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSafeMode ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isSafeMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Botón Reiniciar Conversación */}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Grid Principal: Dos Columnas (Chat a la Izquierda y Timeline a la Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
        {/* COLUMNA IZQUIERDA: CHAT (7 de 12 columnas) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          {/* Header del Chat */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Lumen Asistente</div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  En línea
                </div>
              </div>
            </div>

            {/* Sugerencias Rápidas para Demostración en Vídeo */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                "Precio del blanqueamiento",
                "Quiero agendar para el viernes",
                "Tengo dolor insoportable",
              ].map((sug) => (
                <button
                  key={sug}
                  onClick={() => handleSend(sug)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg text-slate-600 transition-colors shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Mensajes del Chat */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fadeIn`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-xs shadow-xs"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {/* Si el mensaje del asistente invocó herramientas, mostrar badge discreto */}
                      {!isUser && m.toolSteps && m.toolSteps.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {m.toolSteps.map((step) => (
                            <span
                              key={step.id}
                              className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              {step.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 max-w-[85%] animate-fadeIn">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-500 shadow-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[11px]">Consultando herramientas y respondiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Caja de Entrada de Texto */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje como si fueras un paciente (ej: ¿Cuánto cuesta la limpieza?)..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LÍNEA DE TIEMPO DE HERRAMIENTAS (5 de 12 columnas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs flex flex-col overflow-hidden text-slate-200">
          {/* Header del Timeline */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                Línea de Tiempo de Herramientas
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              {timelineSteps.length} llamada(s)
            </span>
          </div>

          {/* Cuerpo del Timeline */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 font-mono text-xs">
            {timelineSteps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-2">
                <Layers className="w-8 h-8 text-slate-600" />
                <p className="text-xs font-sans text-slate-400 font-medium">
                  Esperando llamadas a herramientas
                </p>
                <p className="text-[11px] font-sans text-slate-500 max-w-xs">
                  Cuando el usuario pregunte por precios, horarios o citas, verás aquí en vivo cada tool invocada con sus parámetros y respuesta.
                </p>
              </div>
            ) : (
              timelineSteps.map((step, idx) => {
                const isExpanded = expandedStepId === step.id;

                return (
                  <div
                    key={step.id}
                    className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2.5 transition-all hover:border-slate-600"
                  >
                    {/* Fila Principal */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getToolIcon(step.name)}
                        <span className="font-bold text-emerald-400">{step.name}()</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.isSimulated && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans">
                            Modo Seguro
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{step.timestamp}</span>
                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Descripción Humana del Paso */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {step.description}
                    </p>

                    {/* Acordeón Expandible de Input y Output JSON */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-700/60 space-y-2 text-[11px] animate-fadeIn">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                            Parámetros Enviados (Input):
                          </span>
                          <pre className="p-2 bg-slate-950 rounded-lg text-emerald-300 text-[10px] overflow-x-auto">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                            Resultado Obtenido (Output):
                          </span>
                          <pre className="p-2 bg-slate-950 rounded-lg text-blue-300 text-[10px] overflow-x-auto">
                            {typeof step.output === "string"
                              ? step.output
                              : JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={timelineEndRef} />
          </div>

          {/* Footer del Timeline */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Auditoría en vivo conectada con Actividad
            </span>
            <span className="font-mono text-[10px]">Max 5 tools/turno</span>
          </div>
        </div>
      </div>
    </div>
  );
}
