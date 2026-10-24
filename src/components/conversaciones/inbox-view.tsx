"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  User,
  Bot,
  UserCheck,
  Send,
  Zap,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Globe,
  Radio,
  Power,
  RotateCcw,
} from "lucide-react";

interface MessageItem {
  id: string;
  senderType: "CONTACT" | "ASSISTANT" | "AGENT";
  content: string;
  createdAt: string;
  toolCalls?: any;
}

interface ConversationItem {
  id: string;
  channel: string;
  status: "BOT" | "WAITING_HUMAN" | "HUMAN_ACTIVE" | "CLOSED";
  lastMessageAt: string;
  waitingReason?: string | null;
  unreadCount: number;
  contact: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    interestNotes?: string | null;
  };
  messages: MessageItem[];
}

interface InboxViewProps {
  initialConversations: ConversationItem[];
}

export function InboxView({ initialConversations }: InboxViewProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(
    initialConversations[0] || null
  );

  const [filter, setFilter] = useState<"all" | "needs_attention" | "whatsapp" | "web">("all");
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingControl, setUpdatingControl] = useState(false);
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);

  // Soporte móvil: vista lista o vista chat
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Cargar detalles de la conversación activa
  const selectConversation = async (conv: ConversationItem) => {
    setActiveConversationId(conv.id);
    setActiveConversation(conv);
    setMobileView("chat");

    try {
      const res = await fetch(`/api/conversations/${conv.id}`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
      }
    } catch {}
  };

  // Filtrado de conversaciones
  const filteredConversations = conversations.filter((c) => {
    if (filter === "needs_attention" && c.status !== "WAITING_HUMAN") return false;
    if (filter === "whatsapp" && c.channel !== "whatsapp") return false;
    if (filter === "web" && c.channel !== "web") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.contact.name?.toLowerCase().includes(q);
      const matchPhone = c.contact.phone?.toLowerCase().includes(q);
      const matchLastMsg = c.messages?.[0]?.content?.toLowerCase().includes(q);
      return matchName || matchPhone || matchLastMsg;
    }

    return true;
  });

  // Tomar el control / Devolver al asistente
  const handleToggleControl = async () => {
    if (!activeConversation) return;
    setUpdatingControl(true);

    const isHumanNow = activeConversation.status === "HUMAN_ACTIVE";
    const action = isHumanNow ? "return_to_bot" : "take_control";

    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.conversation) {
        const updated = {
          ...activeConversation,
          status: data.conversation.status,
          waitingReason: data.conversation.waitingReason,
        };
        setActiveConversation(updated);
        setConversations(conversations.map((c) => (c.id === updated.id ? updated : c)));
      }
    } catch (e) {
      alert("Error al actualizar control");
    } finally {
      setUpdatingControl(false);
    }
  };

  // Enviar mensaje manual como agente humano
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || sending) return;

    setSending(true);
    const text = inputText.trim();
    setInputText("");

    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        const updatedMessages = [...(activeConversation.messages || []), data.message];
        const updatedConv = {
          ...activeConversation,
          status: "HUMAN_ACTIVE" as const,
          messages: updatedMessages,
          lastMessageAt: new Date().toISOString(),
        };

        setActiveConversation(updatedConv);
        setConversations(
          conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }
    } catch (e) {
      alert("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-170px)] min-h-[580px]">
      {/* COLUMNA 1: LISTA DE CONVERSACIONES (Ancho fijo en desktop, switch en móvil) */}
      <div
        className={`w-full md:w-88 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/40 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Filtros Rápidos y Buscador */}
        <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente, teléfono..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todas" },
              { id: "needs_attention", label: "Esperan humano" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "web", label: "Web" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors ${
                  filter === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron conversaciones con los filtros aplicados.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = activeConversationId === c.id;
              const isWaiting = c.status === "WAITING_HUMAN";
              const isHumanActive = c.status === "HUMAN_ACTIVE";
              const lastMsg = c.messages?.[c.messages.length - 1]?.content || "Sin mensajes";

              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? "bg-blue-50/70 border-l-4 border-l-blue-600"
                      : "hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      c.channel === "whatsapp"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {c.channel === "whatsapp" ? "WA" : "WEB"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {c.contact.name || "Paciente Anónimo"}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {new Date(c.lastMessageAt).toLocaleTimeString("es-VE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{lastMsg}</p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {isWaiting && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Espera atención
                        </span>
                      )}
                      {isHumanActive && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                          <UserCheck className="w-2.5 h-2.5" />
                          Control humano
                        </span>
                      )}
                      {!isWaiting && !isHumanActive && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          <Bot className="w-2.5 h-2.5" />
                          Atendido por IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMNA 2: ÁREA DE CHAT ACTIVO Y CONTROL */}
      <div
        className={`flex-1 flex flex-col overflow-hidden bg-slate-50/20 ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Header del Chat Abierto */}
            <div className="px-6 py-3.5 border-b border-slate-200/80 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botón Volver en Móvil */}
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {activeConversation.contact.name || "Paciente"}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                      {activeConversation.channel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeConversation.contact.phone || "Canal Web"} · Zona: Caracas
                  </p>
                </div>
              </div>

              {/* Botones de Control: Tomar Control / Devolver al Asistente */}
              <div className="flex items-center gap-3 shrink-0">
                {activeConversation.status === "HUMAN_ACTIVE" ? (
                  <button
                    onClick={handleToggleControl}
                    disabled={updatingControl}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Devolver al Asistente
                  </button>
                ) : (
                  <button
                    onClick={handleToggleControl}
                    disabled={updatingControl}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Tomar el Control
                  </button>
                )}
              </div>
            </div>

            {/* Aviso si la conversación espera atención */}
            {activeConversation.status === "WAITING_HUMAN" && (
              <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/60 text-xs text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <strong>Atención requerida:</strong>{" "}
                  {activeConversation.waitingReason || "El cliente ha solicitado un agente humano."}
                </span>
                <button
                  onClick={handleToggleControl}
                  className="underline font-bold text-amber-900 hover:text-black text-[11px]"
                >
                  Tomar control ahora
                </button>
              </div>
            )}

            {activeConversation.status === "HUMAN_ACTIVE" && (
              <div className="px-6 py-2 bg-purple-50 border-b border-purple-200/60 text-xs text-purple-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <strong>Modo Humano Activo:</strong> El asistente de IA está silenciado en esta conversación.
                </span>
              </div>
            )}

            {/* Mensajes del Chat */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {activeConversation.messages?.map((m) => {
                const isUser = m.senderType === "CONTACT";
                const isAgent = m.senderType === "AGENT";
                const isBot = m.senderType === "ASSISTANT";

                const hasTools = Boolean(
                  m.toolCalls &&
                    (Array.isArray(m.toolCalls) ? m.toolCalls.length > 0 : Object.keys(m.toolCalls).length > 0)
                );
                const isToolsExpanded = expandedToolMsgId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-start" : "items-end"} animate-fadeIn`}
                  >
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] shrink-0 mb-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-xs"
                            : isAgent
                            ? "bg-purple-600 text-white rounded-br-xs shadow-xs"
                            : "bg-blue-600 text-white rounded-br-xs shadow-xs"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>

                        {/* Desplegable de Herramientas del Asistente */}
                        {isBot && hasTools && (
                          <div className="mt-2.5 pt-2 border-t border-blue-500/40">
                            <button
                              type="button"
                              onClick={() => setExpandedToolMsgId(isToolsExpanded ? null : m.id)}
                              className="text-[10px] text-blue-100 hover:text-white flex items-center gap-1 font-semibold"
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              {isToolsExpanded ? "Ocultar herramientas usadas" : "Ver herramientas usadas"}
                              {isToolsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isToolsExpanded && (
                              <div className="mt-2 p-2 bg-blue-950/70 rounded-lg text-[10px] font-mono text-blue-200 overflow-x-auto">
                                <pre>{JSON.stringify(m.toolCalls, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {isUser ? "Paciente" : isAgent ? "Tú (Equipo)" : "Asistente IA"} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para Responder Manualmente */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeConversation.status === "HUMAN_ACTIVE"
                      ? "Escribe una respuesta como agente del equipo..."
                      : "Escribe aquí para tomar el control y responder manualmente..."
                  }
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Ninguna conversación seleccionada</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Elige una conversación de la lista para leer y responder.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
