import Link from "next/link";
import Script from "next/script";
import { Sparkles, Phone, MapPin, Bot, CheckCircle2 } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Carga del widget real de Atiende */}
      <Script
        src="/widget.js"
        data-app-url="http://localhost:3000"
        data-color="#0284c7"
        strategy="lazyOnload"
      />

      {/* Banner de demostración */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-blue-400" />
        <span>
          Esta es la web de demostración para clientes. Haz clic en la <strong>burbuja flotante azul</strong> en la esquina inferior derecha para probar la atención en vivo.
        </span>
        <Link href="/" className="ml-3 px-2 py-0.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">
          Volver al Panel
        </Link>
      </div>

      {/* Header del Negocio */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              R
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight">Clínica Dental Riky</div>
              <div className="text-xs text-slate-500">Chacao, Caracas · Odontología Especializada</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div className="hidden sm:flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              <span>+58 212 555 0123</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Centro Seguros La Paz, Piso 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Primera Visita y Radiografía Digital Gratuita
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Tu sonrisa en las mejores manos con tecnología avanzada
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Especialistas en ortodoncia invisible, diseño de sonrisa, implantes y blanqueamiento dental en Caracas. Atendemos emergencias de lunes a viernes.
          </p>
        </div>

        {/* Tarjetas de tratamientos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl">
              ✨
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Blanqueamiento LED</h3>
            <p className="text-xs text-slate-500">Aclaramiento seguro en consultorio de 1 a 2 sesiones con láser frío.</p>
            <div className="text-xs font-bold text-sky-600 pt-2">$150 sesión completa</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl">
              🦷
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Ortodoncia Invisible</h3>
            <p className="text-xs text-slate-500">Alineadores transparentes removibles con escaneo digital 3D.</p>
            <div className="text-xs font-bold text-sky-600 pt-2">Desde $800 (Financiamiento disponible)</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl">
              🛡️
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Limpieza y Profilaxis</h3>
            <p className="text-xs text-slate-500">Eliminación de sarro con ultrasonido suave y aplicación de flúor protector.</p>
            <div className="text-xs font-bold text-sky-600 pt-2">$40</div>
          </div>
        </div>

        {/* Ficha de Información de la Web */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">¿Cómo funciona la burbuja de chat en esta web?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                El widget se inyecta con una sola línea de script HTML en cualquier plataforma (WordPress, Shopify, Webflow o HTML plano).
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Responde en tiempo real conectándose con el motor agéntico de Atiende y agenda citas en Google Calendar.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
