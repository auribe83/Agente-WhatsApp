"use client";

import { useState } from "react";
import {
  Blocks,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  X,
  Save,
  Send,
  Loader2,
  HelpCircle,
  Shield,
  CreditCard,
  Hash,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  logoSvg: string;
  category: string;
  authType: string;
  status: "DISCONNECTED" | "CONNECTED" | "ERROR";
  isEnabled: boolean;
  accountEmail: string | null;
  maskedCredential: string;
  settings: Record<string, any>;
  capabilities: Record<string, boolean>;
  capabilityLabels: Record<string, { label: string; desc: string }>;
  lastError: string | null;
}

interface IntegrationsViewProps {
  initialIntegrations: IntegrationItem[];
}

export function IntegrationsView({ initialIntegrations }: IntegrationsViewProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [activeIntegration, setActiveIntegration] = useState<IntegrationItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  // Estados del modal de edición
  const [currentCredential, setCurrentCredential] = useState("");
  const [currentCapabilities, setCurrentCapabilities] = useState<Record<string, boolean>>({});
  const [currentSettings, setCurrentSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const openConfigModal = (item: IntegrationItem) => {
    setActiveIntegration(item);
    setCurrentCapabilities(item.capabilities || {});
    setCurrentSettings(item.settings || {});
    setCurrentCredential("");
    setTestResult(null);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!activeIntegration) return;
    setSaving(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeIntegration.id,
          capabilities: currentCapabilities,
          settings: currentSettings,
        }),
      });

      if (res.ok) {
        setIntegrations(
          integrations.map((i) =>
            i.id === activeIntegration.id
              ? { ...i, capabilities: currentCapabilities, settings: currentSettings }
              : i
          )
        );
        setIsConfigModalOpen(false);
      }
    } catch {
      alert("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleManualConnect = async () => {
    if (!activeIntegration) return;
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/manual-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeIntegration.id,
          credential: currentCredential,
          settings: currentSettings,
          capabilities: currentCapabilities,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIntegrations(
          integrations.map((i) =>
            i.id === activeIntegration.id
              ? {
                  ...i,
                  status: "CONNECTED",
                  accountEmail: data.integration.accountEmail,
                  settings: currentSettings,
                  capabilities: currentCapabilities,
                  lastError: null,
                }
              : i
          )
        );
        setIsConfigModalOpen(false);
      } else {
        alert(data.error || "Error al conectar");
      }
    } catch {
      alert("Error en la conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("¿Deseas desconectar esta integración?")) return;
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setIntegrations(
          integrations.map((i) =>
            i.id === id
              ? { ...i, status: "DISCONNECTED", accountEmail: null, maskedCredential: "" }
              : i
          )
        );
        setIsConfigModalOpen(false);
      }
    } catch {
      alert("Error al desconectar");
    }
  };

  const handleTestIntegration = async (id: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult("¡Prueba ejecutada con éxito! Revisa la notificación o el servicio.");
      } else {
        setTestResult(`Error: ${data.error || "Fallo en la prueba"}`);
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guía Desplegable de Google Cloud OAuth */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowGoogleGuide(!showGoogleGuide)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Guía de Conexión Google Cloud (Calendar, Gmail y Sheets)
              </h3>
              <p className="text-[11px] text-slate-500">
                Aprende a configurar tu cliente OAuth de tipo «Aplicación web» y evitar desconexiones a los 7 días.
              </p>
            </div>
          </div>
          {showGoogleGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showGoogleGuide && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-4 bg-slate-50/30 leading-relaxed">
            <div className="space-y-2">
              <p className="font-bold text-slate-800">1. Crear Credenciales en Google Cloud Console:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Ve a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-600 underline">Google Cloud Console &gt; APIs y Servicios &gt; Credenciales</a>.</li>
                <li>Crea un ID de cliente de OAuth de tipo <strong>«Aplicación web»</strong>.</li>
                <li>En <strong>Orígenes autorizados de JavaScript</strong> pon: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">http://localhost:3000</code></li>
                <li>En <strong>URI de redireccionamiento autorizados</strong> pon exactamente: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">http://localhost:3000/api/integrations/google/callback</code></li>
                <li>Copia el <strong>ID de cliente</strong> y el <strong>Secreto de cliente</strong> a tu archivo <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env</code> en <code className="text-slate-800">GOOGLE_CLIENT_ID</code> y <code className="text-slate-800">GOOGLE_CLIENT_SECRET</code>.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <p className="font-bold text-slate-800">2. Pantalla de Consentimiento en Producción (Evitar caducidad de 7 días):</p>
              <p>
                Por defecto, Google crea las pantallas de consentimiento en modo de prueba (*Testing*). En ese modo, Google caduca los tokens de actualización (*refresh token*) cada 7 días, lo que provocaría que Calendar o Sheets se desconecten solos cada semana.
              </p>
              <p>
                Para solucionarlo, ve a <strong>Pantalla de consentimiento de OAuth</strong>, selecciona tipo <strong>Externa</strong> y pulsa el botón <strong>«Publicar aplicación»</strong> para ponerla en estado <strong>«En producción»</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <p className="font-bold text-slate-800">3. Aviso de «Aplicación no verificada»:</p>
              <p>
                Al conectar, Google mostrará una pantalla que dice <em>«Google no ha verificado esta aplicación»</em>. Esto es completamente normal para software interno o de agencia.
              </p>
              <p>
                Para continuar, el usuario simplemente debe hacer clic en <strong>«Avanzada»</strong> (o <em>Advanced</em>) y luego en <strong>«Ir a Atiende (no seguro)»</strong>. Para que el aviso desaparezca definitivamente, haría falta enviar un video de demostración y la política de privacidad a Google para su verificación formal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Catálogo de Tarjetas de Integración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const isConnected = item.status === "CONNECTED";
          const isError = item.status === "ERROR";

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all ${
                isError
                  ? "border-red-300 ring-1 ring-red-200"
                  : isConnected
                  ? "border-emerald-200 bg-white"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                {/* Cabecera con Logo Oficial y Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl p-2.5 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: item.logoSvg }}
                  />

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isError
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isConnected && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isError && <AlertCircle className="w-3 h-3 text-red-600" />}
                      {isConnected ? "Conectada" : isError ? "Error" : "Sin conectar"}
                    </span>

                    {item.accountEmail && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                        {item.accountEmail}
                      </p>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>

                {isError && item.lastError && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700">
                    {item.lastError}
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openConfigModal(item)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Configurar
                </button>

                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(item.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Desconectar
                  </button>
                ) : item.authType === "oauth_google" ? (
                  <a
                    href={`/api/integrations/google/auth?service=${
                      item.id === "google_calendar"
                        ? "calendar"
                        : item.id === "gmail"
                        ? "gmail"
                        : "sheets"
                    }`}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    Conectar
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => openConfigModal(item)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / DRAWER DE CONFIGURACIÓN Y PERMISOS MODULARES */}
      {isConfigModalOpen && activeIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg p-1.5 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0"
                  dangerouslySetInnerHTML={{ __html: activeIntegration.logoSvg }}
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeIntegration.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Configuración de permisos y herramientas para el asistente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Conexión si no es OAuth */}
              {activeIntegration.authType !== "oauth_google" && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800">
                    {activeIntegration.id === "slack"
                      ? "URL del Webhook de Slack"
                      : activeIntegration.id === "stripe"
                      ? "Clave Restringida de Stripe (Restricted API Key)"
                      : "Configuración del Webhook"}
                  </h4>

                  {activeIntegration.id === "stripe" && (
                    <div className="text-[11px] text-slate-500">
                      Crea una Restricted Key con permiso de escritura en <code>Checkout Sessions</code>. Soporta tanto modo prueba (<code>rk_test_...</code>) como modo real (<code>rk_live_...</code>).
                    </div>
                  )}

                  {activeIntegration.id === "slack" && (
                    <div className="text-[11px] text-slate-500">
                      Pega la URL de Incoming Webhook generada en tu espacio de trabajo de Slack (ej: <code>https://hooks.slack.com/services/...</code>).
                    </div>
                  )}

                  <input
                    type="password"
                    value={currentCredential}
                    onChange={(e) => setCurrentCredential(e.target.value)}
                    placeholder={
                      activeIntegration.maskedCredential
                        ? `Configurada: ${activeIntegration.maskedCredential}`
                        : "Pega tu clave o URL secreta aquí..."
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono text-xs"
                  />
                </div>
              )}

              {/* Casillas de Capacidades del Asistente */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">
                  ¿Qué puede hacer el asistente con esta integración?
                </h4>
                <div className="space-y-2">
                  {Object.entries(activeIntegration.capabilityLabels).map(([key, info]) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(currentCapabilities[key])}
                        onChange={(e) =>
                          setCurrentCapabilities({
                            ...currentCapabilities,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-blue-600 mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{info.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{info.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ajustes Propios de Cada Integración */}
              {activeIntegration.id === "google_calendar" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800">Opciones de Google Calendar</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Duración por defecto (minutos)
                      </label>
                      <input
                        type="number"
                        value={currentSettings.durationMinutes || 30}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            durationMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Margen entre citas (minutos)
                      </label>
                      <input
                        type="number"
                        value={currentSettings.bufferMinutes || 10}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            bufferMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeIntegration.id === "google_sheets" && currentSettings.url && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Hoja de Cálculo Creada
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Tu hoja «Contactos — Clínica Dental Lumen» está vinculada.
                  </p>
                  <a
                    href={currentSettings.url}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 underline mt-1"
                  >
                    Abrir hoja en Google Sheets <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {activeIntegration.id === "stripe" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800">Seña por Defecto</h4>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Monto de la Seña (USD)
                    </label>
                    <input
                      type="number"
                      value={currentSettings.defaultDepositAmount || 20}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          defaultDepositAmount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              )}

              {activeIntegration.id === "webhooks" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800">Configuración del Destino</h4>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      URL de Destino (Endpoint HTTP POST)
                    </label>
                    <input
                      type="url"
                      value={currentSettings.targetUrl || ""}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, targetUrl: e.target.value })
                      }
                      placeholder="https://tu-n8n.com/webhook/atiende"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Clave Secreta para Firma HMAC SHA-256
                    </label>
                    <input
                      type="text"
                      value={currentSettings.secret || "whsec_atiende_2026"}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, secret: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Botón de Prueba en Vivo */}
              {["slack", "webhooks", "stripe"].includes(activeIntegration.id) && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Prueba de Conexión</span>
                    <p className="text-[11px] text-slate-400">Envía un evento de prueba en vivo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestIntegration(activeIntegration.id)}
                    disabled={testing}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    {testing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Enviar Prueba
                  </button>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-[11px] ${
                    testResult.startsWith("¡")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {testResult}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Los tokens se almacenan cifrados con AES-256-GCM
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cerrar
                </button>

                {currentCredential ? (
                  <button
                    type="button"
                    onClick={handleManualConnect}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Conectar y Guardar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
