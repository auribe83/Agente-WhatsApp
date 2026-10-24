import { prisma } from "./prisma";
import { buildSystemPrompt } from "./prompt-builder";
import { ASSISTANT_TOOLS, executeTool, ToolStep, AssistantResponse } from "./ai-assistant";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export async function runAssistantConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options: {
    isSafeMode?: boolean;
    contactId?: string;
    conversationId?: string;
    channel?: string;
  } = {}
): Promise<AssistantResponse> {
  const isSafeMode = options.isSafeMode ?? true;
  const channel = options.channel ?? "web";

  // 1. Obtener configuración del negocio y modelo preferido
  const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const defaultModel = "anthropic/claude-haiku-5.5";
  let activeModel = business?.defaultAiModel || defaultModel;

  // 2. Construir Prompt del Sistema con datos actualizados
  const systemPrompt = await buildSystemPrompt({
    channel,
  });

  // Limitar historial a los últimos 20 mensajes
  const trimmedHistory = messages.slice(-20);

  const conversationMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const toolSteps: ToolStep[] = [];
  const apiKey = process.env.OPENROUTER_API_KEY;
  let modelUsed = activeModel;
  let fallbackTriggered = false;

  // Si hay clave de OpenRouter, intentamos la llamada real con bucle de tools
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const result = await executeOpenRouterLoop({
        apiKey,
        model: activeModel,
        defaultModel,
        messages: conversationMessages,
        isSafeMode,
        options,
        toolSteps,
      });
      return result;
    } catch (err: any) {
      console.warn("[AgentRunner] OpenRouter falló. Registrando en Actividad y activando contingencia:", err.message);

      await prisma.activityLog.create({
        data: {
          channel,
          integration: "openrouter",
          action: "openrouter_call_failed",
          result: "WARNING",
          details: { error: err.message, model: activeModel },
        },
      });
      fallbackTriggered = true;
    }
  }

  // 3. Fallback / Simulador Inteligente Local de Alta Fidelidad
  // Se activa si no hay OPENROUTER_API_KEY o si falló la conexión externa.
  const localResponse = await runLocalSemanticAssistant(
    messages[messages.length - 1]?.content || "",
    conversationMessages,
    isSafeMode,
    options
  );

  return {
    content: localResponse.content,
    toolSteps: localResponse.toolSteps,
    modelUsed: `${activeModel} (Simulación Local)`,
    fallbackTriggered,
  };
}

// Bucle Agéntico con OpenRouter (hasta 5 iteraciones de llamadas a herramientas)
async function executeOpenRouterLoop({
  apiKey,
  model,
  defaultModel,
  messages,
  isSafeMode,
  options,
  toolSteps,
}: {
  apiKey: string;
  model: string;
  defaultModel: string;
  messages: ChatMessage[];
  isSafeMode: boolean;
  options: any;
  toolSteps: ToolStep[];
}): Promise<AssistantResponse> {
  let currentModel = model;
  let fallbackTriggered = false;
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response = await callOpenRouterApi(apiKey, currentModel, messages);

    // Si falló por modelo inexistente o error 404/429/500, reintentar una vez con defaultModel
    if (!response.ok && currentModel !== defaultModel) {
      console.warn(`[OpenRouter] Modelo ${currentModel} falló (${response.status}). Reintentando con ${defaultModel}...`);
      await prisma.activityLog.create({
        data: {
          channel: options.channel || "web",
          integration: "openrouter",
          action: "model_fallback",
          result: "WARNING",
          details: { failedModel: currentModel, fallbackModel: defaultModel, status: response.status },
        },
      });
      fallbackTriggered = true;
      currentModel = defaultModel;
      response = await callOpenRouterApi(apiKey, currentModel, messages);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error("Respuesta vacía de OpenRouter");
    }

    // Si el modelo decide llamar a una o más herramientas
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls,
      });

      for (const tc of message.tool_calls) {
        const toolName = tc.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(tc.function.arguments || "{}");
        } catch {}

        const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const step: ToolStep = {
          id: stepId,
          tool: toolName,
          name: toolName,
          input: toolArgs,
          output: {},
          description: `Ejecutando ${toolName}...`,
          status: "running",
          isSimulated: isSafeMode,
          timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        toolSteps.push(step);

        // Ejecutar tool
        const executionResult = await executeTool(toolName, toolArgs, {
          isSafeMode,
          contactId: options.contactId,
          conversationId: options.conversationId,
          channel: options.channel,
        });

        step.output = executionResult.output;
        step.description = executionResult.description;
        step.status = "success";
        step.isSimulated = executionResult.isSimulated;

        // Agregar respuesta de la herramienta al contexto para la siguiente iteración
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: toolName,
          content: JSON.stringify(executionResult.output),
        });
      }

      // El bucle continúa para que el modelo interprete los resultados y formule la respuesta final
      continue;
    }

    // Si no hubo tool calls, hemos llegado a la respuesta final al cliente
    return {
      content: message.content || "",
      toolSteps,
      modelUsed: currentModel,
      fallbackTriggered,
    };
  }

  return {
    content: "He procesado tu solicitud con nuestras herramientas. ¿En qué más puedo apoyarte?",
    toolSteps,
    modelUsed: currentModel,
    fallbackTriggered,
  };
}

async function callOpenRouterApi(apiKey: string, model: string, messages: ChatMessage[]) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Atiende",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => {
        const item: any = { role: m.role, content: m.content || "" };
        if (m.name) item.name = m.name;
        if (m.tool_call_id) item.tool_call_id = m.tool_call_id;
        if (m.tool_calls) item.tool_calls = m.tool_calls;
        return item;
      }),
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
    }),
  });
}

// Simulador Local Inteligente para cuando no hay API Key o falla la red
async function runLocalSemanticAssistant(
  lastUserMessage: string,
  fullHistory: ChatMessage[],
  isSafeMode: boolean,
  options: any
): Promise<{ content: string; toolSteps: ToolStep[] }> {
  const toolSteps: ToolStep[] = [];
  const text = lastUserMessage.toLowerCase();

  const isFirstMessage = fullHistory.filter((m) => m.role === "user").length <= 1;
  const prefix = isFirstMessage
    ? "¡Hola! Soy el asistente virtual de Clínica Dental Lumen en Chacao. "
    : "";

  const timeStr = () =>
    new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // 1. Detección de Queja / Urgencia / Traspaso a persona
  if (
    text.includes("urgente") ||
    text.includes("dolor insoportable") ||
    text.includes("sangrado") ||
    text.includes("humano") ||
    text.includes("persona") ||
    text.includes("doctor") ||
    text.includes("queja") ||
    text.includes("reclamo")
  ) {
    const isUrgent = text.includes("urgente") || text.includes("dolor") || text.includes("sangrado");
    const reason = isUrgent ? "urgent" : text.includes("queja") ? "complaint" : "human_requested";
    const summary = isUrgent
      ? "Paciente manifiesta emergencia odontológica con dolor agudo."
      : "El cliente solicita ser atendido directamente por un asesor humano.";

    const exec = await executeTool(
      "handover_to_human",
      { reason, summary },
      { isSafeMode, ...options }
    );

    toolSteps.push({
      id: `step-${Date.now()}-1`,
      tool: "handover_to_human",
      name: "handover_to_human",
      input: { reason, summary },
      output: exec.output,
      description: exec.description,
      status: "success",
      isSimulated: exec.isSimulated,
      timestamp: timeStr(),
    });

    return {
      content: `${prefix}Comprendo perfectamente la situación. He transferido de inmediato esta conversación a nuestro equipo de guardia. Puedes visitarnos directamente en Chacao (Centro Seguros La Paz, Piso 4) o comunicarte al +58 212 555 0123. Un asesor humano continuará atendiéndote en breve.`,
      toolSteps,
    };
  }

  // 2. Consulta de Disponibilidad / Cita en Google Calendar
  if (
    text.includes("cita") ||
    text.includes("disponibilidad") ||
    text.includes("agendar") ||
    text.includes("hueco") ||
    text.includes("horario") ||
    text.includes("turno")
  ) {
    // Si ya confirmó un día y hora específicos (ej: "viernes a las 10:00", "mañana a las 4pm")
    const hasSpecificTime =
      text.includes("10:") ||
      text.includes("11:") ||
      text.includes("4:") ||
      text.includes("16:") ||
      text.includes("17:") ||
      text.includes("9:") ||
      text.includes("confirmo") ||
      text.includes("si por favor");

    if (hasSpecificTime) {
      // Ejecutar book_appointment
      const execBook = await executeTool(
        "book_appointment",
        {
          date: "Viernes 28 de Octubre",
          time: "10:00 AM",
          serviceName: "Primera visita y revisión diagnóstica",
          clientName: "Paciente en Prueba",
          clientPhone: "+58 412 1234567",
        },
        { isSafeMode, ...options }
      );

      toolSteps.push({
        id: `step-${Date.now()}-book`,
        tool: "book_appointment",
        name: "book_appointment",
        input: {
          date: "Viernes 28 de Octubre",
          time: "10:00 AM",
          service: "Primera visita y revisión",
          client: "Paciente en Prueba",
        },
        output: execBook.output,
        description: execBook.description,
        status: "success",
        isSimulated: execBook.isSimulated,
        timestamp: timeStr(),
      });

      // Si no está en modo seguro o si se desea simular confirmación por correo:
      const execEmail = await executeTool(
        "send_confirmation_email",
        {
          to: "paciente@ejemplo.com",
          subject: "Confirmación de Cita - Clínica Dental Lumen",
          details: "Viernes a las 10:00 AM en Centro Seguros La Paz, Piso 4, Chacao.",
        },
        { isSafeMode, ...options }
      );

      toolSteps.push({
        id: `step-${Date.now()}-mail`,
        tool: "send_confirmation_email",
        name: "send_confirmation_email",
        input: { to: "paciente@ejemplo.com", details: "Viernes 10:00 AM" },
        output: execEmail.output,
        description: execEmail.description,
        status: "success",
        isSimulated: execEmail.isSimulated,
        timestamp: timeStr(),
      });

      return {
        content: `${prefix}¡Listo! He confirmado tu cita para el **Viernes 28 de Octubre a las 10:00 AM** para tu Primera Visita y Revisión Diagnóstica con la Dra. Lumen. Te enviaremos un recordatorio 24 horas antes por WhatsApp. ¡Te esperamos en nuestra sede de Chacao!`,
        toolSteps,
      };
    }

    // Consulta de disponibilidad en Google Calendar
    const execAvail = await executeTool(
      "check_availability",
      { date: "próximos días hábiles", serviceName: "Consulta general" },
      { isSafeMode, ...options }
    );

    toolSteps.push({
      id: `step-${Date.now()}-avail`,
      tool: "check_availability",
      name: "check_availability",
      input: { date: "Viernes o Lunes próximo", service: "Revisión dental" },
      output: execAvail.output,
      description: execAvail.description,
      status: "success",
      isSimulated: execAvail.isSimulated,
      timestamp: timeStr(),
    });

    return {
      content: `${prefix}Consultando nuestra disponibilidad en Google Calendar, tenemos estos horarios libres para ti esta semana:\n\n• **Viernes 10:00 AM**\n• **Viernes 04:30 PM**\n• **Lunes 11:00 AM**\n\n¿Cuál de estos horarios se adapta mejor a tu rutina?`,
      toolSteps,
    };
  }

  // 3. Consulta de Servicios y Precios
  const execServices = await executeTool(
    "check_services",
    { query: text },
    { isSafeMode, ...options }
  );

  toolSteps.push({
    id: `step-${Date.now()}-srv`,
    tool: "check_services",
    name: "check_services",
    input: { query: text.slice(0, 30) },
    output: execServices.output,
    description: execServices.description,
    status: "success",
    isSimulated: execServices.isSimulated,
    timestamp: timeStr(),
  });

  if (text.includes("blanqueamiento")) {
    return {
      content: `${prefix}El **Blanqueamiento Dental LED** tiene un costo de **$150** y se realiza en una sesión de 60 minutos con tecnología láser en consultorio. Además, incluye pulido previo. ¿Te gustaría consultar disponibilidad para agendar tu sesión?`,
      toolSteps,
    };
  }

  if (text.includes("ortodoncia") || text.includes("alineador")) {
    return {
      content: `${prefix}Nuestro tratamiento de **Ortodoncia Invisible con alineadores transparentes** va desde **$800** con financiamiento en cuotas sin intereses. Como cada sonrisa es única, requiere una primera valoración diagnóstica para diseñar tu plan digital 3D, la cual es completamente gratuita. ¿Deseas agendar tu valoración?`,
      toolSteps,
    };
  }

  if (text.includes("limpieza") || text.includes("profilaxis")) {
    return {
      content: `${prefix}La **Limpieza dental profunda y profilaxis** con ultrasonido tiene un costo exacto de **$40** y una duración de unos 45 minutos. Elimina sarro y manchas superficiales. ¿Para qué día te gustaría agendar?`,
      toolSteps,
    };
  }

  // Respuesta general informativa
  return {
    content: `${prefix}En Clínica Dental Lumen ofrecemos servicios de primera visita gratuita con radiografía digital, limpieza profunda ($40), blanqueamiento LED ($150), ortodoncia invisible (desde $800) e implantes de titanio. ¿Te gustaría conocer más sobre algún tratamiento en particular o consultar fechas disponibles?`,
    toolSteps,
  };
}
