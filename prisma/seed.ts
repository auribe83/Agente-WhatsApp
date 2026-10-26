import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Iniciando carga de datos de Clínica Dental Riky...");

  // 1. Usuario Administrador
  const adminEmail = process.env.ADMIN_EMAIL || "admin@atiende.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword2026*";
  const adminName = process.env.ADMIN_NAME || "Administrador Riky";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`[Seed] Usuario administrador listo: ${admin.email}`);

  // 2. Marca de Agencia
  await prisma.agencyBrand.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Atiende",
      logoUrl: null,
    },
  });

  // 3. Configuración del Negocio
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Clínica Dental Riky",
      description: "Clínica odontológica de alta especialidad en Caracas. Cuidamos tu salud bucal con calidez y tecnología avanzada.",
      address: "Av. Francisco de Miranda, Centro Seguros La Paz, Piso 4, Ofic. 402, Chacao, Caracas",
      phone: "+58 212 555 0123",
      website: "https://clinicariky.ejemplo.com",
      timezone: "America/Caracas",
      isActive: true,
      defaultAiModel: "anthropic/claude-haiku-5.5",
      freeTextInfo: "Disponemos de estacionamiento con vigilancia privada. Aceptamos pagos en divisas en efectivo, transferencias Zelle, Banesco Panamá, y pago móvil a tasa BCV. Todos los tratamientos cuentan con garantía de satisfacción.",
    },
  });

  // 4. Comportamiento del Asistente
  const scheduleConfig = [
    { day: "Lunes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
    { day: "Martes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
    { day: "Miércoles", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
    { day: "Jueves", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
    { day: "Viernes", enabled: true, morningStart: "09:00", morningEnd: "14:00", afternoonStart: "16:00", afternoonEnd: "20:00" },
    { day: "Sábado", enabled: false, morningStart: "09:00", morningEnd: "13:00", afternoonStart: "", afternoonEnd: "" },
    { day: "Domingo", enabled: false, morningStart: "", morningEnd: "", afternoonStart: "", afternoonEnd: "" },
  ];

  const handoverTriggers = {
    complaint: true,
    urgent: true,
    human_requested: true,
    unknown_answer: true,
    customRule: "Si el paciente menciona dolor severo o sangrado continuo, pasar inmediatamente al odontólogo de guardia.",
  };

  await prisma.assistantBehavior.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Riky Asistente",
      tone: "cercano",
      welcomeMessage: "¡Hola! Te damos la bienvenida a Clínica Dental Riky en Chacao. ¿En qué podemos apoyarte hoy con tu sonrisa?",
      instructions: "Eres el asistente virtual de Clínica Dental Riky. Atiendes de manera empática, educada y profesional en español de Venezuela. Respondes dudas sobre tratamientos, das citas en Google Calendar según disponibilidad confirmando previamente fecha, hora y servicio, y registras el contacto. Eres breve y natural como en WhatsApp.",
      forbiddenRules: "1. NUNCA des diagnósticos clínicos ni recetes medicamentos (antibióticos o analgésicos).\n2. NUNCA inventes precios ni confirmes citas sin antes haber consultado los huecos libres y validado con el paciente.\n3. NUNCA te salgas del rol de asistente de la clínica.",
      scheduleConfig,
      outOfHoursMode: "take_appointment",
      handoverTriggers,
    },
  });

  // 5. Los 8 Servicios
  const services = [
    {
      name: "Primera visita y revisión diagnóstica",
      description: "Evaluación clínica integral, radiografía digital y plan de tratamiento personalizado.",
      durationMinutes: 30,
      priceFrom: 0,
      priceExact: 0,
      requiresEvaluation: false,
      stripeDepositAmount: 0,
    },
    {
      name: "Limpieza dental profunda y profilaxis",
      description: "Eliminación de sarro con ultrasonido, pulido y aplicación de flúor.",
      durationMinutes: 45,
      priceFrom: 40,
      priceExact: 40,
      requiresEvaluation: false,
      stripeDepositAmount: 15,
    },
    {
      name: "Empaste / Restauración estética con resina",
      description: "Tratamiento de caries y reconstrucción dental con resinas de alta estética.",
      durationMinutes: 45,
      priceFrom: 50,
      priceExact: null,
      requiresEvaluation: false,
      stripeDepositAmount: 20,
    },
    {
      name: "Endodoncia unirradicular o multirradicular",
      description: "Tratamiento de conducto para salvar piezas dentales con pulpa afectada.",
      durationMinutes: 60,
      priceFrom: 120,
      priceExact: null,
      requiresEvaluation: true,
      stripeDepositAmount: 30,
    },
    {
      name: "Blanqueamiento dental LED",
      description: "Aclaramiento dental seguro en consultorio de 1 a 2 sesiones.",
      durationMinutes: 60,
      priceFrom: 150,
      priceExact: 150,
      requiresEvaluation: false,
      stripeDepositAmount: 40,
    },
    {
      name: "Ortodoncia invisible (Alineadores)",
      description: "Corrección de alineación dental mediante alineadores transparentes cómodos y discretos.",
      durationMinutes: 45,
      priceFrom: 800,
      priceExact: null,
      requiresEvaluation: true,
      stripeDepositAmount: 50,
    },
    {
      name: "Implantes dentales de titanio",
      description: "Reemplazo fijo y definitivo de piezas dentales perdidas con tornillo de titanio biocompatible.",
      durationMinutes: 60,
      priceFrom: 600,
      priceExact: null,
      requiresEvaluation: true,
      stripeDepositAmount: 50,
    },
    {
      name: "Atención de Urgencias dentales",
      description: "Atención prioritaria para dolor agudo, traumatismos, roturas o inflamaciones.",
      durationMinutes: 30,
      priceFrom: 45,
      priceExact: null,
      requiresEvaluation: false,
      stripeDepositAmount: 0,
    },
  ];

  const existingServicesCount = await prisma.service.count();
  if (existingServicesCount === 0) {
    for (const s of services) {
      await prisma.service.create({ data: s });
    }
    console.log(`[Seed] 8 servicios creados.`);
  }

  // 6. Diez Preguntas Frecuentes (FAQs)
  const faqs = [
    {
      question: "¿La primera visita tiene algún costo?",
      answer: "No, la primera visita de valoración y diagnóstico con radiografía digital incluida es completamente gratuita y sin compromiso.",
      category: "Citas y Costos",
    },
    {
      question: "¿Tienen planes de financiamiento?",
      answer: "Sí, contamos con financiamiento directo en cuotas mensuales sin intereses para tratamientos de ortodoncia invisible e implantes dentales.",
      category: "Pagos",
    },
    {
      question: "¿Aceptan seguros médicos o pólizas dentales?",
      answer: "Emitimos informes clínicos y facturación detallada para reembolso con las principales aseguradoras nacionales e internacionales (Mercantil, Mapfre, Seguros Caracas, Bupa, etc.).",
      category: "Seguros",
    },
    {
      question: "¿Disponen de estacionamiento?",
      answer: "Sí, el Centro Seguros La Paz cuenta con estacionamiento subterráneo público vigilado las 24 horas.",
      category: "Ubicación",
    },
    {
      question: "¿Cómo llegar a la clínica en transporte público?",
      answer: "Estamos a solo dos cuadras de la estación de Metro Chacao, sobre la Av. Francisco de Miranda.",
      category: "Ubicación",
    },
    {
      question: "¿Atienden a niños (odontopediatría)?",
      answer: "¡Sí! Contamos con especialistas en odontopediatría con un ambiente lúdico y adaptado para que los pequeños disfruten su visita sin miedo.",
      category: "Especialidades",
    },
    {
      question: "¿Qué métodos de pago reciben?",
      answer: "Aceptamos efectivo en divisas ($ y €), Zelle, transferencias en Banesco Panamá, tarjetas de débito/crédito nacionales y Pago Móvil a tasa oficial BCV del día.",
      category: "Pagos",
    },
    {
      question: "¿El blanqueamiento dental daña el esmalte?",
      answer: "No. Utilizamos geles con pH neutro certificados que no desgastan el esmalte. Puede haber una ligera sensibilidad pasajera durante las primeras 24 horas.",
      category: "Tratamientos",
    },
    {
      question: "¿Cuánto dura el tratamiento de ortodoncia invisible?",
      answer: "El promedio oscila entre 6 y 14 meses, dependiendo del caso específico diagnosticado en la primera valoración gratuita.",
      category: "Tratamientos",
    },
    {
      question: "¿Qué debo hacer si tengo una urgencia fuera del horario?",
      answer: "Si presentas dolor insoportable, sangrado abundante o traumatismo dental severo, comunícate de inmediato a nuestra línea de emergencia +58 412 555 9999 o acude a un centro médico asistencial.",
      category: "Urgencias",
    },
  ];

  const existingFaqsCount = await prisma.faqItem.count();
  if (existingFaqsCount === 0) {
    for (const f of faqs) {
      await prisma.faqItem.create({ data: f });
    }
    console.log(`[Seed] 10 preguntas frecuentes creadas.`);
  }

  // 7. Canales e Integraciones (Desconectados al inicio)
  const channels = ["whatsapp", "webchat"];
  for (const c of channels) {
    await prisma.channelConfig.upsert({
      where: { id: c },
      update: {},
      create: {
        id: c,
        isEnabled: true,
        status: "DISCONNECTED",
        accountDetails: c === "webchat" ? { color: "#0ea5e9", welcome: "¡Hola! ¿En qué te ayudamos hoy?" } : undefined,
      },
    });
  }

  const integrations = ["google_calendar", "gmail", "google_sheets", "slack", "stripe", "webhooks"];
  for (const i of integrations) {
    await prisma.integrationConfig.upsert({
      where: { id: i },
      update: {},
      create: {
        id: i,
        isEnabled: false,
        status: "DISCONNECTED",
        capabilities: {
          book_appointment: true,
          check_availability: true,
          send_confirmation: true,
          save_lead: true,
          notify_slack: true,
        },
      },
    });
  }

  // 8. Contactos y Conversaciones de ejemplo en la bandeja
  const existingContacts = await prisma.contact.count();
  if (existingContacts === 0) {
    const contact1 = await prisma.contact.create({
      data: {
        name: "María Corina Mendoza",
        phone: "+584141234567",
        whatsappLid: "584141234567@lid",
        email: "mariacorina@ejemplo.com",
        channel: "whatsapp",
        leadStatus: "appointment_scheduled",
        interestNotes: "Interesada en blanqueamiento dental LED",
        conversations: {
          create: {
            channel: "whatsapp",
            status: "BOT",
            unreadCount: 0,
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
            messages: {
              create: [
                {
                  senderType: "CONTACT",
                  content: "Buenas tardes, quisiera saber el precio del blanqueamiento dental",
                  createdAt: new Date(Date.now() - 1000 * 60 * 35),
                },
                {
                  senderType: "ASSISTANT",
                  content: "¡Hola María! Qué gusto saludarte. El blanqueamiento dental LED tiene un costo de $150 y se realiza en consultorio con resultados visibles desde la primera sesión. ¿Te gustaría agendar una cita para esta semana?",
                  createdAt: new Date(Date.now() - 1000 * 60 * 33),
                  toolCalls: [
                    { tool: "check_services", input: { query: "blanqueamiento" }, output: "Blanqueamiento LED: $150" },
                  ],
                },
                {
                  senderType: "CONTACT",
                  content: "Sí por favor, ¿tienen disponibilidad para el viernes a las 10:00 am?",
                  createdAt: new Date(Date.now() - 1000 * 60 * 31),
                },
                {
                  senderType: "ASSISTANT",
                  content: "Perfecto, he confirmado tu cita para el viernes a las 10:00 am para el servicio de Blanqueamiento LED con el Dr. Riky. Te enviaremos un recordatorio el día anterior. ¡Te esperamos!",
                  createdAt: new Date(Date.now() - 1000 * 60 * 30),
                  toolCalls: [
                    { tool: "book_appointment", input: { date: "Viernes", time: "10:00", service: "Blanqueamiento dental LED" }, output: "Cita agendada #4912" },
                  ],
                },
              ],
            },
          },
        },
      },
    });

    const contact2 = await prisma.contact.create({
      data: {
        name: "Carlos Eduardo Gómez",
        phone: "+584129876543",
        whatsappLid: null,
        email: "carlosg@ejemplo.com",
        channel: "web",
        leadStatus: "waiting_human",
        interestNotes: "Urgencia por dolor agudo de muela",
        conversations: {
          create: {
            channel: "web",
            status: "WAITING_HUMAN",
            unreadCount: 1,
            waitingReason: "Urgencia médica con dolor severo",
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 10),
            messages: {
              create: [
                {
                  senderType: "CONTACT",
                  content: "Hola, tengo un dolor insoportable en una muela desde anoche, necesito que me atienda un doctor urgente por favor",
                  createdAt: new Date(Date.now() - 1000 * 60 * 12),
                },
                {
                  senderType: "ASSISTANT",
                  content: "Comprendo perfectamente Carlos, lamento que estés pasando por ese dolor. Por tratarse de una urgencia, he avisado de inmediato a nuestro equipo de odontólogos de guardia. Por favor, puedes dirigirte directamente a nuestra clínica en Chacao (Centro Seguros La Paz, Piso 4) o llamarnos al +58 212 555 0123. Un momento, un asesor humano continuará atendiéndote por aquí.",
                  createdAt: new Date(Date.now() - 1000 * 60 * 10),
                  toolCalls: [
                    { tool: "handover_to_human", input: { reason: "urgencia_dolor_severo" }, output: "Notificación emitida al equipo" },
                  ],
                },
              ],
            },
          },
        },
      },
    });

    console.log(`[Seed] Contactos y conversaciones de ejemplo creados.`);
  }

  console.log("[Seed] ¡Carga de datos completada exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
