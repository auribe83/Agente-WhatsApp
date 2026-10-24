import { prisma } from "./prisma";

export async function buildSystemPrompt(contactInfo?: {
  name?: string | null;
  phone?: string | null;
  channel?: string | null;
  upcomingAppointments?: string[];
}): Promise<string> {
  const [business, behavior, services, faqs, integrations] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.assistantBehavior.findUnique({ where: { id: "default" } }),
    prisma.service.findMany({ where: { isActive: true } }),
    prisma.faqItem.findMany({ where: { isActive: true } }),
    prisma.integrationConfig.findMany({ where: { isEnabled: true, status: "CONNECTED" } }),
  ]);

  const now = new Date();
  const caracasTime = now.toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const toneDescriptions: Record<string, string> = {
    cercano: "Cercano, cálido, empático y servicial. Usa un lenguaje natural y cordial de Venezuela, tuteando amablemente.",
    profesional: "Profesional, cortés, riguroso y respetuoso. Trato formal pero cercano, enfocado en dar claridad y confianza.",
    directo: "Directo, conciso, rápido y enfocado en resolver la necesidad del cliente sin rodeos.",
  };

  const toneText = toneDescriptions[behavior?.tone || "cercano"] || toneDescriptions.cercano;

  const connectedIntegrationNames = integrations.map((i) => i.id).join(", ") || "Ninguna (Modo Autónomo Local)";

  const servicesList = services
    .map(
      (s) =>
        `- ${s.name}: ${s.description} (Duración aprox: ${s.durationMinutes} min. Precio: ${
          s.priceExact !== null
            ? `$${s.priceExact}`
            : s.priceFrom !== null
            ? `Desde $${s.priceFrom}`
            : "A consultar"
        }${s.requiresEvaluation ? " | Requiere valoración previa obligatoria" : ""})`
    )
    .join("\n");

  const faqsList = faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");

  return `ERES EL ASISTENTE VIRTUAL DE IA DE «${business?.name || "Clínica Dental Lumen"}».

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${business?.name}
- Descripción: ${business?.description}
- Dirección: ${business?.address || "No especificada"}
- Teléfono: ${business?.phone || "No especificado"}
- Sitio Web: ${business?.website || "No especificado"}
- Información adicional: ${business?.freeTextInfo || "Ninguna"}
- Zona horaria oficial: America/Caracas (Venezuela).
- Fecha y hora actual: ${caracasTime}

PERSONALIDAD Y TONO DE VOZ:
- Tu nombre de asistente es: ${behavior?.name || "Lumen Asistente"}
- Tono asignado: ${toneText}
- Mensaje de bienvenida inicial: "${behavior?.welcomeMessage}"

INSTRUCCIONES DE ATENCIÓN:
${behavior?.instructions || "Atiende a los clientes con amabilidad y responde a sus consultas sobre los servicios."}

REGLAS ESTRICTAS (LO QUE NUNCA DEBES HACER):
${behavior?.forbiddenRules || "No inventes información que no esté en la base de conocimiento."}
- REGLA FIJA 1: En tu primer mensaje preséntate siempre como el asistente virtual de la clínica.
- REGLA FIJA 2: NUNCA des consejos médicos, diagnósticos clínicos ni recetas farmacológicas. Si preguntan por dolor o medicamentos, aclara que solo el odontólogo puede evaluar y ofrece cita o urgencia.
- REGLA FIJA 3: NUNCA inventes precios ni confirmes citas sin consultar previamente la disponibilidad y confirmar con el cliente el día, la hora y el servicio.
- REGLA FIJA 4: Mensajes cortos, claros y naturales, estilo mensajería WhatsApp. Evita párrafos largos e innecesarios.

CRITERIOS PARA PASAR LA CONVERSACIÓN A UNA PERSONA DEL EQUIPO:
- Petición explícita del cliente ("quiero hablar con una persona", "pásame con un doctor").
- Quejas o reclamos de atención o facturación.
- Urgencias severas (traumatismos dentales, dolor inaguantable, sangrado activo).
- Preguntas complejas de las que no conozcas la respuesta exacta.
- Cuando transfieras, avisa al usuario amablemente y ejecuta la herramienta \`handover_to_human\`.

SERVICIOS DISPONIBLES:
${servicesList || "No hay servicios registrados en este momento."}

PREGUNTAS FRECUENTES (FAQS):
${faqsList || "No hay preguntas frecuentes registradas."}

DATOS DEL CLIENTE EN ESTA SESIÓN:
- Nombre: ${contactInfo?.name || "Aún no identificado"}
- Teléfono: ${contactInfo?.phone || "No disponible"}
- Canal: ${contactInfo?.channel || "web"}
- Próximas citas agendadas: ${contactInfo?.upcomingAppointments?.join(", ") || "Ninguna"}

INTEGRACIONES ACTIVAS:
${connectedIntegrationNames}
`;
}
