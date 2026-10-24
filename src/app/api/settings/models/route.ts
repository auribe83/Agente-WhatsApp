import { NextResponse } from "next/server";

interface CachedModels {
  timestamp: number;
  data: any[];
}

let modelsCache: CachedModels | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

const FALLBACK_MODELS = [
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude 3.5 Haiku (5.5)",
    provider: "Anthropic",
    contextLength: 200000,
    promptPricePerMillion: 0.8,
    completionPricePerMillion: 4.0,
    isRecommended: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextLength: 200000,
    promptPricePerMillion: 3.0,
    completionPricePerMillion: 15.0,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    contextLength: 1048576,
    promptPricePerMillion: 0.1,
    completionPricePerMillion: 0.4,
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    contextLength: 1000000,
    promptPricePerMillion: 0.075,
    completionPricePerMillion: 0.3,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    contextLength: 128000,
    promptPricePerMillion: 0.15,
    completionPricePerMillion: 0.6,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextLength: 128000,
    promptPricePerMillion: 2.5,
    completionPricePerMillion: 10.0,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    provider: "Meta",
    contextLength: 131072,
    promptPricePerMillion: 0.4,
    completionPricePerMillion: 0.4,
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B (Gratis)",
    provider: "Meta",
    contextLength: 131072,
    promptPricePerMillion: 0,
    completionPricePerMillion: 0,
    isFree: true,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const apiKey = process.env.OPENROUTER_API_KEY;

  let keyInfo = {
    isConfigured: Boolean(apiKey && apiKey.trim().length > 0),
    balance: null as number | null,
    limit: null as number | null,
  };

  // Verificar saldo en OpenRouter si hay API Key
  if (keyInfo.isConfigured) {
    try {
      const keyRes = await fetch("https://openrouter.ai/api/v1/key", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        if (keyData?.data) {
          keyInfo.balance = keyData.data.limit_remaining !== undefined ? keyData.data.limit_remaining : keyData.data.usage;
          keyInfo.limit = keyData.data.limit;
        }
      }
    } catch (e) {
      console.warn("No se pudo obtener información de la clave:", e);
    }
  }

  // Verificar caché
  if (!forceRefresh && modelsCache && Date.now() - modelsCache.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      models: modelsCache.data,
      cached: true,
      keyInfo,
    });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Atiende",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error("Respuesta no OK de OpenRouter");
    }

    const json = await res.json();
    const rawModels = json.data || [];

    // Filtrar solo los modelos que soportan herramientas (tools)
    const toolModels = rawModels
      .filter((m: any) => {
        const supported = m.supported_parameters || [];
        return supported.includes("tools");
      })
      .map((m: any) => {
        const pPrice = parseFloat(m.pricing?.prompt || "0") * 1000000;
        const cPrice = parseFloat(m.pricing?.completion || "0") * 1000000;
        const provider = m.id.split("/")[0] || "Otro";

        return {
          id: m.id,
          name: m.name || m.id,
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          contextLength: m.context_length || 0,
          promptPricePerMillion: Number(pPrice.toFixed(2)),
          completionPricePerMillion: Number(cPrice.toFixed(2)),
          isFree: pPrice === 0 && cPrice === 0,
          isRecommended: m.id === "anthropic/claude-haiku-5.5",
        };
      });

    modelsCache = {
      timestamp: Date.now(),
      data: toolModels.length > 0 ? toolModels : FALLBACK_MODELS,
    };

    return NextResponse.json({
      models: modelsCache.data,
      cached: false,
      keyInfo,
    });
  } catch (error) {
    console.warn("Usando lista fallback de modelos:", error);
    return NextResponse.json({
      models: FALLBACK_MODELS,
      cached: false,
      keyInfo,
    });
  }
}
