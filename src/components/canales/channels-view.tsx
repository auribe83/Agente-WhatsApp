"use client";

import { useState, useEffect } from "react";
import {
  Radio,
  QrCode,
  MessageSquareCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Power,
  RefreshCw,
  Loader2,
  Sparkles,
  Smartphone,
  Eye,
  Save,
} from "lucide-react";

interface ChannelsViewProps {
  initialWhatsapp: any;
  initialWebchat: any;
  appUrl: string;
}

export function ChannelsView({ initialWhatsapp, initialWebchat, appUrl }: ChannelsViewProps) {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "webchat">("whatsapp");

  // Estado de WhatsApp
  const [waStatus, setWaStatus] = useState<string>(initialWhatsapp?.status || "DISCONNECTED");
  const [waQrCode, setWaQrCode] = useState<string | null>(initialWhatsapp?.qrCode || null);
  const [waAccount, setWaAccount] = useState<any>(initialWhatsapp?.accountDetails || null);
  const [disconnectingWa, setDisconnectingWa] = useState(false);
  const [waMethod, setWaMethod] = useState<"qr" | "code">("qr");
  const [pairingPhone, setPairingPhone] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Estado de Chat Web
  const [webColor, setWebColor] = useState<string>(
    initialWebchat?.accountDetails?.color || "#2563eb"
  );
  const [webWelcome, setWebWelcome] = useState<string>(
    initialWebchat?.accountDetails?.welcome ||
      "¡Hola! Te damos la bienvenida a nuestro consultorio. ¿En qué podemos apoyarte hoy?"
  );
  const [webEnabled, setWebEnabled] = useState<boolean>(initialWebchat?.isEnabled ?? true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [savingWeb, setSavingWeb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Conexión Server-Sent Events (SSE) para el código QR y estado de WhatsApp
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/channels/whatsapp/sse");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status) setWaStatus(data.status);
          setWaQrCode(data.qrCode);
          if (data.accountDetails) setWaAccount(data.accountDetails);
        } catch {}
      };

      eventSource.onerror = () => {
        // Reintentará automáticamente según la especificación SSE del navegador
      };
    } catch (e) {
      console.warn("SSE no disponible:", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleDisconnectWa = async () => {
    if (!confirm("¿Deseas desconectar la sesión de WhatsApp vinculada?")) return;
    setDisconnectingWa(true);
    try {
      const res = await fetch("/api/channels/whatsapp/disconnect", { method: "POST" });
      if (res.ok) {
        setWaStatus("DISCONNECTED");
        setWaQrCode(null);
        setWaAccount(null);
      }
    } catch {
      alert("Error al desconectar WhatsApp");
    } finally {
      setDisconnectingWa(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) {
      setPairingError("Introduce un número de teléfono con código de país (ej. 584121234567)");
      return;
    }
    setRequestingCode(true);
    setPairingError(null);
    try {
      const res = await fetch("/api/channels/whatsapp/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pairingPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPairingError(data.error || "Error al solicitar código");
      }
    } catch (err: any) {
      setPairingError(err?.message || "Error al comunicarse con el servidor");
    } finally {
      setRequestingCode(false);
    }
  };

  const copyPairingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveWebchat = async () => {
    setSavingWeb(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/channels/webchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: webEnabled,
          color: webColor,
          welcome: webWelcome,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch {
      alert("Error al guardar configuración");
    } finally {
      setSavingWeb(false);
    }
  };

  const widgetSnippet = `<script src="${appUrl}/widget.js" data-app-url="${appUrl}" data-color="${webColor}"></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "whatsapp"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          WhatsApp (Baileys)
          {waStatus === "CONNECTED" && (
            <span className="w-2 h-2 rounded-full bg-white ml-1"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("webchat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "webchat"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          Chat para tu Web
        </button>
      </div>

      {/* PESTAÑA 1: WHATSAPP */}
      {activeTab === "whatsapp" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tarjeta de Vinculación y Estado */}
          <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Vinculación de Dispositivo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecta tu número comercial para que el asistente de IA responda automáticamente.
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  waStatus === "CONNECTED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : waStatus === "WAITING_QR"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    waStatus === "CONNECTED"
                      ? "bg-emerald-500"
                      : waStatus === "WAITING_QR"
                      ? "bg-blue-500"
                      : "bg-slate-400"
                  }`}
                />
                {waStatus === "CONNECTED"
                  ? "Conectado"
                  : waStatus === "WAITING_QR"
                  ? "Esperando vinculación"
                  : "Desconectado"}
              </span>
            </div>

            {/* Selector de Método: QR vs Código de 8 Dígitos */}
            {waStatus !== "CONNECTED" && (
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setWaMethod("qr")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    waMethod === "qr"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Escanear Código QR
                </button>
                <button
                  type="button"
                  onClick={() => setWaMethod("code")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    waMethod === "code"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Código de 8 Dígitos (Recomendado)
                </button>
              </div>
            )}

            {/* Visualizador Principal */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200/60 min-h-[340px]">
              {waStatus === "CONNECTED" ? (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      WhatsApp Vinculado Exitosamente
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      Número activo: {waAccount?.phone || "Línea conectada"}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    La sesión está guardada de forma persistente en disco en <code>WHATSAPP_SESSION_DIR</code> y reconectará automáticamente tras cualquier reinicio.
                  </p>
                </div>
              ) : waMethod === "qr" ? (
                /* MÉTODO 1: CÓDIGO QR */
                waQrCode ? (
                  <div className="text-center space-y-4 animate-scaleIn">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                      <img
                        src={waQrCode}
                        alt="Código QR de WhatsApp"
                        className="w-64 h-64 rounded-xl object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                        El código se actualiza automáticamente en vivo (SSE)
                      </p>
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1 px-2.5 max-w-sm mx-auto">
                        ⚠️ <strong>Importante:</strong> Escanéalo directamente desde esta pantalla. No uses fotos viejas porque WhatsApp las expira cada 20 segundos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Iniciando Baileys en el worker...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      El código QR aparecerá aquí en unos instantes.
                    </p>
                  </div>
                )
              ) : (
                /* MÉTODO 2: CÓDIGO DE 8 DÍGITOS */
                <div className="w-full max-w-md space-y-5 animate-scaleIn">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Vinculación por número sin usar la cámara
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Ideal si el escaneo por cámara de WhatsApp da error en tu teléfono o si la pantalla refleja.
                    </p>
                  </div>

                  <form onSubmit={handleRequestPairingCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tu Número de WhatsApp (con código de país)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Ej: 584121234567"
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                          disabled={requestingCode || waAccount?.pairingCode === "GENERATING"}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={requestingCode || waAccount?.pairingCode === "GENERATING"}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                        >
                          {requestingCode || waAccount?.pairingCode === "GENERATING" ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            "Solicitar Código"
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Venezuela: <code>58</code> + código de área + número (ej. 58412XXXXXXX / 58424XXXXXXX)
                      </p>
                    </div>

                    {(pairingError || waAccount?.pairingError) && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                        {pairingError || waAccount?.pairingError}
                      </p>
                    )}
                  </form>

                  {/* Visualización del Código de 8 Dígitos */}
                  {waAccount?.pairingCode && waAccount.pairingCode !== "GENERATING" && (
                    <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 text-center space-y-4 shadow-sm animate-scaleIn">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                        Tu código de vinculación:
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl font-black font-mono tracking-widest text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                          {waAccount.pairingCode}
                        </span>
                        <button
                          onClick={() => copyPairingCode(waAccount.pairingCode)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                          title="Copiar código"
                        >
                          {copiedCode ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="text-left text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-600">
                        <p className="font-bold text-slate-900">Pasos en tu teléfono:</p>
                        <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                          <li>Abre WhatsApp en tu teléfono.</li>
                          <li>Ve a <strong>Ajustes</strong> (o tres puntos) &gt; <strong>Dispositivos vinculados</strong>.</li>
                          <li>Toca en <strong>Vincular un dispositivo</strong>.</li>
                          <li>Toca abajo el texto: <strong>«Vincular con el número de teléfono»</strong>.</li>
                          <li>Introduce el código de 8 dígitos de arriba. ¡Quedará conectado al instante!</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de Desconexión */}
            {waStatus === "CONNECTED" && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={handleDisconnectWa}
                  disabled={disconnectingWa}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  {disconnectingWa ? "Cerrando sesión..." : "Desconectar WhatsApp"}
                </button>
              </div>
            )}
          </div>

          {/* Información y Reglas de WhatsApp */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
              <h4 className="font-bold text-slate-900">Características del Canal WhatsApp</h4>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Buffer Inteligente de 8s:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Si el paciente envía varios mensajes cortos seguidos (*"Hola"*, *"Quería saber el precio"*), el worker los agrupa y responde en un solo turno.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Presencia «Escribiendo»:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Muestra el estado de escribiendo en el chat del usuario antes de responder para brindar un trato humano.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Identificador LID y Filtro de Grupos:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Guarda el número y el LID de WhatsApp; ignora automáticamente grupos, estados y mensajes propios.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Manejo de Audios e Imágenes:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pide educadamente que se escriba por texto y marca la conversación para revisión de un asesor humano.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CHAT PARA TU WEB */}
      {activeTab === "webchat" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Configuración del Widget */}
          <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personalización del Widget</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configura el aspecto visual de la burbuja y el texto inicial de bienvenida.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webEnabled}
                  onChange={(e) => setWebEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-xs font-semibold text-slate-700">Canal Activo</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Color de la Burbuja y Botones
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={webColor}
                    onChange={(e) => setWebColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={webColor}
                    onChange={(e) => setWebColor(e.target.value)}
                    className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl w-32 uppercase text-slate-800"
                  />
                  <div className="flex items-center gap-1.5">
                    {["#2563eb", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWebColor(c)}
                        style={{ backgroundColor: c }}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mensaje de Bienvenida del Chat Web
                </label>
                <textarea
                  rows={3}
                  value={webWelcome}
                  onChange={(e) => setWebWelcome(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  placeholder="Mensaje con el que se abrirá la ventana del chat..."
                />
              </div>
            </div>

            {/* Fragmento de Código para Copiar */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-900">
                Fragmento de Código para Pegar en tu Web
              </label>
              <p className="text-[11px] text-slate-500">
                Copia y pega este script antes de la etiqueta de cierre <code>&lt;/body&gt;</code> en cualquier web (WordPress, Shopify, Webflow, etc.):
              </p>
              <div className="relative">
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto selection:bg-blue-600 selection:text-white">
                  {widgetSnippet}
                </pre>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href="/demo"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Web de Demostración (/demo)
              </a>

              <button
                onClick={handleSaveWebchat}
                disabled={savingWeb}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {savingWeb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saveSuccess ? "¡Guardado!" : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* Previsualización en Vivo de la Burbuja */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-6 shadow-xs min-h-[480px] flex flex-col justify-between relative overflow-hidden">
              <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Vista Previa de la Burbuja Flotante
              </div>

              {/* Simulación de Ventana de Chat */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs max-w-sm mx-auto w-full my-auto animate-scaleIn">
                <div
                  style={{ backgroundColor: webColor }}
                  className="p-3.5 text-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      🤖
                    </div>
                    <div>
                      <div className="font-bold text-xs">Asistente Virtual</div>
                      <div className="text-[10px] text-white/80">En línea</div>
                    </div>
                  </div>
                  <span className="text-lg leading-none cursor-pointer">&times;</span>
                </div>

                <div className="p-4 bg-slate-50 space-y-3 min-h-[160px]">
                  <div className="p-3 bg-white border border-slate-200/70 rounded-2xl rounded-bl-xs text-slate-800 text-[11px] leading-relaxed shadow-2xs">
                    {webWelcome}
                  </div>
                </div>

                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-400">
                    Escribe tu consulta...
                  </div>
                  <button
                    style={{ backgroundColor: webColor }}
                    className="p-1.5 rounded-xl text-white text-xs font-semibold px-2.5"
                  >
                    Enviar
                  </button>
                </div>
              </div>

              {/* Burbuja Flotante Abajo a la Derecha */}
              <div className="flex justify-end">
                <div
                  style={{ backgroundColor: webColor }}
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
                >
                  <MessageSquareCode className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
