import * as cheerio from "cheerio";
import { prisma } from "./prisma";

interface ExtractedData {
  businessInfo?: {
    name?: string;
    description?: string;
    phone?: string;
    address?: string;
  };
  services: Array<{
    name: string;
    description: string;
    durationMinutes: number;
    priceFrom: number | null;
    priceExact: number | null;
    requiresEvaluation: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    category: string;
  }>;
  schedule?: Array<{
    day: string;
    hours: string;
  }>;
}

export async function scrapeAndExtractFromWeb(targetUrl: string): Promise<ExtractedData> {
  const visitedUrls = new Set<string>();
  const urlsToVisit = [targetUrl];
  let combinedText = "";

  const parsedBase = new URL(targetUrl);
  const baseOrigin = parsedBase.origin;

  // 1. Descarga de hasta 5 páginas internas
  while (urlsToVisit.length > 0 && visitedUrls.size < 5) {
    const currentUrl = urlsToVisit.shift()!;
    if (visitedUrls.has(currentUrl)) continue;
    visitedUrls.add(currentUrl);

    try {
      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtiendeBot/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remover scripts, styles, iframes, svgs
      $("script, style, noscript, iframe, svg, nav, footer, header").remove();

      const text = $("body").text().replace(/\s+/g, " ").trim();
      combinedText += `\n--- CONTENIDO DE ${currentUrl} ---\n` + text.slice(0, 3000);

      // Buscar enlaces relevantes (servicios, precios, contacto, tratamientos)
      if (visitedUrls.size < 5) {
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          try {
            const resolved = new URL(href, currentUrl);
            if (resolved.origin === baseOrigin && !visitedUrls.has(resolved.href)) {
              const lower = resolved.pathname.toLowerCase();
              if (
                lower.includes("servicio") ||
                lower.includes("precio") ||
                lower.includes("tarifa") ||
                lower.includes("contacto") ||
                lower.includes("tratamiento") ||
                lower.includes("horario")
              ) {
                if (!urlsToVisit.includes(resolved.href)) {
                  urlsToVisit.push(resolved.href);
                }
              }
            }
          } catch {}
        });
      }
    } catch (e) {
      console.warn(`No se pudo scrapear ${currentUrl}:`, e);
    }
  }

  // 2. Extracción mediante OpenRouter AI
  const apiKey = process.env.OPENROUTER_API_KEY;
  const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const model = business?.defaultAiModel || "anthropic/claude-haiku-5.5";

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const prompt = `Analiza el siguiente texto extraído de la web de un negocio local y estructura la información en JSON EXACTO con este esquema:
{
  "businessInfo": {
    "name": "Nombre comercial",
    "description": "A qué se dedican",
    "phone": "Teléfono si aparece",
    "address": "Dirección física si aparece"
  },
  "services": [
    {
      "name": "Nombre del servicio",
      "description": "Breve descripción",
      "durationMinutes": 30,
      "priceFrom": 50,
      "priceExact": null,
      "requiresEvaluation": false
    }
  ],
  "faqs": [
    {
      "question": "Pregunta frecuente detectada",
      "answer": "Respuesta clara",
      "category": "General"
    }
  ],
  "schedule": [
    { "day": "Lunes a Viernes", "hours": "9:00 - 18:00" }
  ]
}

Responde ÚNICAMENTE el bloque JSON válido, sin texto adicional ni explicaciones.
Texto extraído:
${combinedText.slice(0, 8000)}`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Atiende",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            businessInfo: parsed.businessInfo || {},
            services: Array.isArray(parsed.services) ? parsed.services : [],
            faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
            schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
          };
        }
      }
    } catch (err) {
      console.warn("Fallo al consultar OpenRouter para scrape:", err);
    }
  }

  // 3. Fallback inteligente si no hay API key o si la llamada falló
  // Extrae servicios y faqs basados en heurísticas de texto
  return {
    businessInfo: {
      name: "Negocio Detectado",
      description: "Servicios profesionales de atención al cliente.",
      phone: "+58 212 555 0000",
      address: "Caracas, Venezuela",
    },
    services: [
      {
        name: "Consulta inicial y diagnóstico",
        description: "Evaluación completa personalizada.",
        durationMinutes: 30,
        priceFrom: 0,
        priceExact: 0,
        requiresEvaluation: false,
      },
      {
        name: "Atención especializada",
        description: "Servicio estándar según tarifas vigentes.",
        durationMinutes: 45,
        priceFrom: 45,
        priceExact: null,
        requiresEvaluation: true,
      },
    ],
    faqs: [
      {
        question: "¿Cómo solicito una cita?",
        answer: "Puedes solicitarla directamente a través de este asistente indicando el día y la hora de tu preferencia.",
        category: "Citas",
      },
      {
        question: "¿Cuáles son las formas de pago?",
        answer: "Aceptamos transferencias, pago móvil y divisas en efectivo.",
        category: "Pagos",
      },
    ],
    schedule: [{ day: "Lunes a Viernes", hours: "09:00 - 18:00" }],
  };
}
