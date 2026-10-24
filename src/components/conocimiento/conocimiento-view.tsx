"use client";

import { useState } from "react";
import {
  Building2,
  ListPlus,
  HelpCircle,
  FileText,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  DollarSign,
  Clock,
  Sparkles,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceFrom: number | null;
  priceExact: number | null;
  requiresEvaluation: boolean;
  stripeDepositAmount: number | null;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

interface ConocimientoViewProps {
  initialBusiness: any;
  initialServices: ServiceItem[];
  initialFaqs: FaqItem[];
}

export function ConocimientoView({
  initialBusiness,
  initialServices,
  initialFaqs,
}: ConocimientoViewProps) {
  const [activeTab, setActiveTab] = useState<"business" | "services" | "faqs" | "freeText">("services");

  // Estado del negocio
  const [businessName, setBusinessName] = useState(initialBusiness?.name || "");
  const [description, setDescription] = useState(initialBusiness?.description || "");
  const [address, setAddress] = useState(initialBusiness?.address || "");
  const [phone, setPhone] = useState(initialBusiness?.phone || "");
  const [website, setWebsite] = useState(initialBusiness?.website || "");
  const [freeTextInfo, setFreeTextInfo] = useState(initialBusiness?.freeTextInfo || "");
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [saveBusinessSuccess, setSaveBusinessSuccess] = useState(false);

  // Estado de servicios
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Estado de FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  // Estado de importación web
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [selectedScrapeServices, setSelectedScrapeServices] = useState<number[]>([]);
  const [selectedScrapeFaqs, setSelectedScrapeFaqs] = useState<number[]>([]);
  const [savingScraped, setSavingScraped] = useState(false);

  // Guardar datos generales del negocio
  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      const res = await fetch("/api/knowledge/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          description,
          address,
          phone,
          website,
          freeTextInfo,
        }),
      });
      if (res.ok) {
        setSaveBusinessSuccess(true);
        setTimeout(() => setSaveBusinessSuccess(false), 2500);
      }
    } catch {
      alert("Error al guardar");
    } finally {
      setSavingBusiness(false);
    }
  };

  // Guardar Servicio (Crear o Actualizar)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name) return;

    try {
      const isEdit = Boolean(editingService.id);
      const res = await fetch("/api/knowledge/services", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });
      const data = await res.json();
      if (res.ok && data.service) {
        if (isEdit) {
          setServices(services.map((s) => (s.id === data.service.id ? data.service : s)));
        } else {
          setServices([...services, data.service]);
        }
        setIsServiceModalOpen(false);
        setEditingService(null);
      }
    } catch {
      alert("Error al guardar servicio");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Deseas eliminar este servicio?")) return;
    try {
      const res = await fetch(`/api/knowledge/services?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
      }
    } catch {
      alert("Error al eliminar servicio");
    }
  };

  // Guardar FAQ (Crear o Actualizar)
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    try {
      const isEdit = Boolean(editingFaq.id);
      const res = await fetch("/api/knowledge/faqs", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFaq),
      });
      const data = await res.json();
      if (res.ok && data.faq) {
        if (isEdit) {
          setFaqs(faqs.map((f) => (f.id === data.faq.id ? data.faq : f)));
        } else {
          setFaqs([...faqs, data.faq]);
        }
        setIsFaqModalOpen(false);
        setEditingFaq(null);
      }
    } catch {
      alert("Error al guardar FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta pregunta frecuente?")) return;
    try {
      const res = await fetch(`/api/knowledge/faqs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFaqs(faqs.filter((f) => f.id !== id));
      }
    } catch {
      alert("Error al eliminar FAQ");
    }
  };

  // Importar desde web
  const handleStartScrape = async () => {
    if (!scrapeUrl) return;
    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setScrapeResult(data.data);
        // Seleccionar todos por defecto
        setSelectedScrapeServices(data.data.services.map((_: any, i: number) => i));
        setSelectedScrapeFaqs(data.data.faqs.map((_: any, i: number) => i));
      } else {
        alert(data.error || "No se pudo extraer información de la web");
      }
    } catch {
      alert("Error al conectar con la web");
    } finally {
      setScraping(false);
    }
  };

  const handleApplyScrapedData = async () => {
    if (!scrapeResult) return;
    setSavingScraped(true);
    try {
      const servicesToSave = scrapeResult.services.filter((_: any, i: number) =>
        selectedScrapeServices.includes(i)
      );
      const faqsToSave = scrapeResult.faqs.filter((_: any, i: number) =>
        selectedScrapeFaqs.includes(i)
      );

      const res = await fetch("/api/knowledge/scrape", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedServices: servicesToSave,
          selectedFaqs: faqsToSave,
          businessInfo: scrapeResult.businessInfo,
        }),
      });

      if (res.ok) {
        setIsScrapeModalOpen(false);
        window.location.reload();
      }
    } catch {
      alert("Error al guardar los datos importados");
    } finally {
      setSavingScraped(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón Importar desde Web y Selector de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "services", label: `Servicios (${services.length})`, icon: ListPlus },
            { id: "faqs", label: `Preguntas Frecuentes (${faqs.length})`, icon: HelpCircle },
            { id: "business", label: "Datos del Negocio", icon: Building2 },
            { id: "freeText", label: "Texto Libre", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsScrapeModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Globe className="w-3.5 h-3.5" />
          Importar desde una web
        </button>
      </div>

      {/* PESTAÑA 1: SERVICIOS */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Catálogo de Servicios</h2>
              <p className="text-xs text-slate-500">
                El asistente usa esta lista para responder precios, tiempos y agendar citas.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingService({
                  name: "",
                  description: "",
                  durationMinutes: 30,
                  priceFrom: null,
                  priceExact: null,
                  requiresEvaluation: false,
                  stripeDepositAmount: null,
                });
                setIsServiceModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nuevo Servicio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingService(s);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {s.durationMinutes} min
                    </span>
                    <span className="font-semibold text-slate-900">
                      {s.priceExact !== null
                        ? `$${s.priceExact}`
                        : s.priceFrom !== null
                        ? `Desde $${s.priceFrom}`
                        : "A consultar"}
                    </span>
                  </div>

                  {s.requiresEvaluation && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/60">
                      Valoración previa
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: FAQS */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Preguntas Frecuentes (FAQs)</h2>
              <p className="text-xs text-slate-500">
                Respuestas exactas para dudas comunes sobre pagos, seguros, estacionamiento y ubicación.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingFaq({
                  question: "",
                  answer: "",
                  category: "General",
                });
                setIsFaqModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nueva Pregunta
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {f.category || "General"}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{f.question}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFaq(f);
                        setIsFaqModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(f.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-2 border-l-2 border-blue-500/30">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: DATOS DEL NEGOCIO */}
      {activeTab === "business" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Información General de la Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ¿A qué se dedica el negocio? (Descripción breve)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sitio Web Oficial
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleSaveBusiness}
              disabled={savingBusiness}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingBusiness ? "Guardando..." : "Guardar Información"}
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: TEXTO LIBRE */}
      {activeTab === "freeText" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Texto Libre de Conocimiento</h2>
          <p className="text-xs text-slate-500">
            Escribe cualquier detalle adicional sobre métodos de pago (Zelle, Pago Móvil), garantías, accesibilidad o instrucciones que el asistente deba tener siempre en mente.
          </p>
          <textarea
            rows={8}
            value={freeTextInfo}
            onChange={(e) => setFreeTextInfo(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 leading-relaxed"
            placeholder="Ejemplo: Aceptamos transferencias Zelle y pago móvil a tasa oficial..."
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveBusiness}
              disabled={savingBusiness}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingBusiness ? "Guardando..." : "Guardar Texto Libre"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR SERVICIO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingService?.id ? "Editar Servicio" : "Nuevo Servicio"}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingService?.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  placeholder="Ej: Limpieza dental con ultrasonido"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  value={editingService?.description || ""}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={editingService?.durationMinutes || 30}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Precio Fijo ($)</label>
                  <input
                    type="number"
                    value={editingService?.priceExact ?? ""}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        priceExact: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 50"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Precio «Desde» ($)</label>
                  <input
                    type="number"
                    value={editingService?.priceFrom ?? ""}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        priceFrom: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 80"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(editingService?.requiresEvaluation)}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      requiresEvaluation: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Requiere valoración previa (el bot avisará que el precio final depende del diagnóstico)
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingFaq?.id ? "Editar Pregunta Frecuente" : "Nueva Pregunta Frecuente"}
              </h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={editingFaq?.category || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  placeholder="Ej: Pagos, Seguros, Ubicación..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pregunta</label>
                <input
                  type="text"
                  required
                  value={editingFaq?.question || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="¿Aceptan seguro médico?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Respuesta</label>
                <textarea
                  rows={3}
                  required
                  value={editingFaq?.answer || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Escribe la respuesta clara que dará el asistente..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Guardar FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR DESDE UNA WEB CON IA */}
      {isScrapeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Importar Conocimiento desde una Web
                </h3>
                <p className="text-[11px] text-slate-500">
                  Descargamos hasta 5 páginas internas y la IA extraerá los servicios, horarios y FAQs.
                </p>
              </div>
              <button
                onClick={() => setIsScrapeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://tu-negocio-o-cliente.com"
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <button
                  onClick={handleStartScrape}
                  disabled={scraping || !scrapeUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    "Analizar Web"
                  )}
                </button>
              </div>

              {scrapeResult && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                    <p className="font-semibold">Información Encontrada:</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Selecciona qué elementos deseas añadir a tu catálogo:
                    </p>
                  </div>

                  {/* Servicios detectados */}
                  {scrapeResult.services?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">
                        Servicios Detectados ({scrapeResult.services.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {scrapeResult.services.map((s: any, idx: number) => (
                          <label
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer hover:bg-slate-100/60"
                          >
                            <input
                              type="checkbox"
                              checked={selectedScrapeServices.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScrapeServices([...selectedScrapeServices, idx]);
                                } else {
                                  setSelectedScrapeServices(
                                    selectedScrapeServices.filter((i) => i !== idx)
                                  );
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="font-semibold text-slate-800">{s.name}</div>
                              <div className="text-[11px] text-slate-500">{s.description}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Duración: {s.durationMinutes}m · Precio: {s.priceFrom ? `Desde $${s.priceFrom}` : `$${s.priceExact || 0}`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs detectadas */}
                  {scrapeResult.faqs?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">
                        Preguntas Frecuentes Detectadas ({scrapeResult.faqs.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {scrapeResult.faqs.map((f: any, idx: number) => (
                          <label
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer hover:bg-slate-100/60"
                          >
                            <input
                              type="checkbox"
                              checked={selectedScrapeFaqs.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScrapeFaqs([...selectedScrapeFaqs, idx]);
                                } else {
                                  setSelectedScrapeFaqs(
                                    selectedScrapeFaqs.filter((i) => i !== idx)
                                  );
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="font-semibold text-slate-800">{f.question}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{f.answer}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {scrapeResult && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {selectedScrapeServices.length} servicios y {selectedScrapeFaqs.length} FAQs seleccionados
                </span>
                <button
                  onClick={handleApplyScrapedData}
                  disabled={savingScraped}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {savingScraped ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Guardar Seleccionados"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
