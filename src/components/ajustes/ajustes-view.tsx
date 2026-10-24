"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Calculator,
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building,
  Users,
  Check,
  Save,
  Plus,
  Loader2,
  DollarSign,
  Info,
} from "lucide-react";

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPricePerMillion: number;
  completionPricePerMillion: number;
  isFree?: boolean;
  isRecommended?: boolean;
}

interface AjustesViewProps {
  initialBusiness: any;
  initialBrand: any;
  initialUsers: any[];
}

export function AjustesView({ initialBusiness, initialBrand, initialUsers }: AjustesViewProps) {
  // Ajustes de IA
  const [selectedModel, setSelectedModel] = useState(
    initialBusiness?.defaultAiModel || "anthropic/claude-haiku-5.5"
  );
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelSearch, setModelSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recommended" | "price" | "name">("recommended");
  const [keyInfo, setKeyInfo] = useState<{ isConfigured: boolean; balance: number | null }>({
    isConfigured: false,
    balance: null,
  });

  // Calculadora de Costes
  const [monthlyConversations, setMonthlyConversations] = useState(1000);
  const [inputTokensPerConv, setInputTokensPerConv] = useState(20000);
  const [outputTokensPerConv, setOutputTokensPerConv] = useState(2000);

  // Marca
  const [agencyName, setAgencyName] = useState(initialBrand?.name || "Atiende");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState(initialBrand?.logoUrl || "");

  // Zona Horaria
  const [timezone, setTimezone] = useState(initialBusiness?.timezone || "America/Caracas");

  // Usuarios
  const [users, setUsers] = useState(initialUsers);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STAFF");
  const [creatingUser, setCreatingUser] = useState(false);

  // Estados de guardado
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchModels = async (forceRefresh = false) => {
    setLoadingModels(true);
    try {
      const res = await fetch(`/api/settings/models?refresh=${forceRefresh}`);
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
      if (data.keyInfo) {
        setKeyInfo(data.keyInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Filtrado y Ordenación de modelos
  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
          m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
          m.provider.toLowerCase().includes(modelSearch.toLowerCase());

        if (!matchesSearch) return false;

        if (providerFilter === "all") return true;
        if (providerFilter === "free") return m.isFree;
        if (providerFilter === "anthropic") return m.provider.toLowerCase().includes("anthropic");
        if (providerFilter === "google") return m.provider.toLowerCase().includes("google");
        if (providerFilter === "openai") return m.provider.toLowerCase().includes("openai");

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recommended") {
          if (a.isRecommended) return -1;
          if (b.isRecommended) return 1;
        }
        if (sortBy === "price") {
          return a.promptPricePerMillion - b.promptPricePerMillion;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [models, modelSearch, providerFilter, sortBy]);

  // Modelo actualmente seleccionado
  const currentModelData = useMemo(() => {
    return (
      models.find((m) => m.id === selectedModel) || {
        id: selectedModel,
        name: selectedModel,
        provider: "Desconocido",
        promptPricePerMillion: 0.8,
        completionPricePerMillion: 4.0,
      }
    );
  }, [models, selectedModel]);

  // Cálculo de estimación mensual
  const estimatedCost = useMemo(() => {
    const totalInputTokens = monthlyConversations * inputTokensPerConv;
    const totalOutputTokens = monthlyConversations * outputTokensPerConv;

    const inputCost = (totalInputTokens / 1_000_000) * currentModelData.promptPricePerMillion;
    const outputCost = (totalOutputTokens / 1_000_000) * currentModelData.completionPricePerMillion;

    return Number((inputCost + outputCost).toFixed(2));
  }, [monthlyConversations, inputTokensPerConv, outputTokensPerConv, currentModelData]);

  // Guardar Ajustes Generales y Modelo
  const handleSaveSettings = async () => {
    setSavingGeneral(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultAiModel: selectedModel,
          timezone,
          agencyName,
          logoUrl: agencyLogoUrl,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      alert("Error al guardar ajustes");
    } finally {
      setSavingGeneral(false);
    }
  };

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers([...users, data.user]);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
      } else {
        alert(data.error || "Error al crear usuario");
      }
    } catch {
      alert("Error en la conexión");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN MODELO DE IA Y OPENROUTER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Modelo de Inteligencia Artificial (OpenRouter)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Solo se muestran modelos compatibles con llamadas a herramientas (function calling).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                keyInfo.isConfigured
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {keyInfo.isConfigured ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  API Key Configurada
                  {keyInfo.balance !== null && (
                    <span className="font-mono ml-1 text-slate-600">(${keyInfo.balance})</span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Sin API Key (Modo Local)
                </>
              )}
            </span>

            <button
              onClick={() => fetchModels(true)}
              disabled={loadingModels}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
              title="Refrescar catálogo desde OpenRouter"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingModels ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Selector y Buscador de Modelos */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Buscar modelo por nombre, proveedor o id (ej: haiku, gpt-4o, gemini)..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: "all", label: "Todos" },
                { id: "free", label: "Gratis" },
                { id: "anthropic", label: "Anthropic" },
                { id: "google", label: "Google" },
                { id: "openai", label: "OpenAI" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setProviderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    providerFilter === f.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="recommended">Recomendados</option>
                <option value="price">Menor Precio</option>
                <option value="name">Nombre</option>
              </select>
            </div>
          </div>

          {/* Lista de Modelos (con scroll) */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto bg-slate-50/50">
            {filteredModels.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50/70 border-l-4 border-l-blue-600" : "hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({m.provider})</span>
                        {m.isRecommended && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.2 rounded-full font-semibold">
                            Recomendado
                          </span>
                        )}
                        {m.isFree && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.2 rounded-full font-semibold">
                            Gratis
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{m.id}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-semibold text-slate-800">
                      {m.isFree
                        ? "Gratis"
                        : `$${m.promptPricePerMillion} / $${m.completionPricePerMillion} /M tokens`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contexto: {(m.contextLength / 1000).toFixed(0)}k tokens
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimación de Costos Mensuales */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Estimación de Costo para el Modelo Seleccionado
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
              ${estimatedCost} USD / mes
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Cálculo estimado para {monthlyConversations.toLocaleString()} conversaciones al mes con{" "}
            <strong>{currentModelData.name}</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Conversaciones al mes
              </label>
              <input
                type="number"
                value={monthlyConversations}
                onChange={(e) => setMonthlyConversations(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Tokens de entrada / conv.
              </label>
              <input
                type="number"
                value={inputTokensPerConv}
                onChange={(e) => setInputTokensPerConv(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Tokens de salida / conv.
              </label>
              <input
                type="number"
                value={outputTokensPerConv}
                onChange={(e) => setOutputTokensPerConv(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MARCA DE LA AGENCIA Y ZONA HORARIA */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-700" />
          Marca Blanca de la Agencia y Región
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre de tu Agencia (Marca del Panel)
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="Ej. Atiende o TuAgencia Digital"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Logo de la Agencia (URL)
            </label>
            <input
              type="url"
              value={agencyLogoUrl}
              onChange={(e) => setAgencyLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Zona Horaria Oficial
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled
            className="w-full px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Configurada de forma predeterminada en <strong>America/Caracas</strong> (Venezuela, UTC-4).
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={savingGeneral}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingGeneral ? "Guardando..." : "Guardar Ajustes"}
          </button>
        </div>
      </div>

      {/* 3. USUARIOS Y EQUIPO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          Miembros del Equipo y Accesos
        </h2>

        {/* Lista de usuarios */}
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="p-3.5 flex items-center justify-between text-xs bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-700 uppercase">
                {u.role}
              </span>
            </div>
          ))}
        </div>

        {/* Formulario nuevo usuario */}
        <form onSubmit={handleCreateUser} className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800">Agregar Miembro al Equipo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Nombre completo"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Contraseña segura"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingUser}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {creatingUser ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
