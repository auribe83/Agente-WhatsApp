import { IntegrationDefinition } from "./types";

export const INTEGRATIONS_CATALOG: IntegrationDefinition[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Consulta disponibilidad y agenda citas en tiempo real confirmando día, hora y tratamiento.",
    category: "google",
    authType: "oauth_google",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><path fill="#EA4335" d="M24 4.5v19.5H43.5c0-10.77-8.73-19.5-19.5-19.5z"/><path fill="#4285F4" d="M4.5 24c0 10.77 8.73 19.5 19.5 19.5V24H4.5z"/><path fill="#FBBC05" d="M4.5 24C4.5 13.23 13.23 4.5 24 4.5V24H4.5z"/><path fill="#34A853" d="M24 24h19.5c0 10.77-8.73 19.5-19.5 19.5V24z"/></svg>`,
    defaultCapabilities: {
      check_availability: true,
      book_appointment: true,
      reschedule_or_cancel: true,
    },
    capabilityLabels: {
      check_availability: {
        label: "Consultar huecos libres",
        desc: "Permite al asistente ver espacios vacíos dentro del horario de atención.",
      },
      book_appointment: {
        label: "Crear citas confirmadas",
        desc: "Permite al asistente agendar la cita con nombre, servicio y teléfono.",
      },
      reschedule_or_cancel: {
        label: "Cambiar o cancelar citas",
        desc: "Permite al cliente solicitar reprogramación o cancelación a través del chat.",
      },
    },
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Envía confirmaciones automáticas de cita y el resumen diario de actividad al propietario.",
    category: "google",
    authType: "oauth_google",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><path fill="#EA4335" d="M45 16.2v20.8c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V16.2l21 13.1 21-13.1z"/><path fill="#C5221F" d="M24 29.3L3 16.2V11c0-2.2 1.8-4 4-4h34c2.2 0 4 1.8 4 4v5.2L24 29.3z"/></svg>`,
    defaultCapabilities: {
      send_booking_confirmation: true,
      daily_owner_summary: true,
    },
    capabilityLabels: {
      send_booking_confirmation: {
        label: "Enviar confirmación al cliente",
        desc: "Envía un correo con fecha, hora y ubicación si el cliente facilita su email.",
      },
      daily_owner_summary: {
        label: "Resumen diario al dueño",
        desc: "Envía un reporte nocturno por correo con las métricas del día.",
      },
    },
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Crea automáticamente la hoja de contactos y registra cada lead con sus datos y citas.",
    category: "google",
    authType: "oauth_google",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><path fill="#0F9D58" d="M29 6H11C9.3 6 8 7.3 8 9v30c0 1.7 1.3 3 3 3h26c1.7 0 3-1.3 3-3V17L29 6z"/><path fill="#87CEAC" d="M29 6v11h11L29 6z"/><path fill="#FFF" d="M14 22h20v2H14zm0 6h20v2H14zm0 6h20v2H14z"/></svg>`,
    defaultCapabilities: {
      sync_contacts_and_leads: true,
    },
    capabilityLabels: {
      sync_contacts_and_leads: {
        label: "Sincronizar contactos y citas",
        desc: "Añade una fila con Fecha, Nombre, Teléfono, Canal, Tratamiento y Cita agendada.",
      },
    },
  },
  {
    id: "slack",
    name: "Slack",
    description: "Notifica a tu canal de equipo cuando una conversación escala a un humano o se agenda una cita.",
    category: "comms",
    authType: "webhook_url",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><path fill="#4A154B" d="M0 0h48v48H0z" rx="8"/><path fill="#E01E5A" d="M19 14.5a2.5 2.5 0 0 1-5 0V12h2.5a2.5 2.5 0 0 1 2.5 2.5zm-5 6a2.5 2.5 0 0 1 0-5H20v2.5a2.5 2.5 0 0 1-2.5 2.5H14z"/><path fill="#36C5F0" d="M29 19a2.5 2.5 0 0 1 0-5h2.5V16.5A2.5 2.5 0 0 1 29 19zm-6-5a2.5 2.5 0 0 1 5 0V20h-2.5A2.5 2.5 0 0 1 23 17.5V14z"/><path fill="#2EB67D" d="M29 33.5a2.5 2.5 0 0 1 5 0V36h-2.5a2.5 2.5 0 0 1-2.5-2.5zm5-6a2.5 2.5 0 0 1 0 5H28v-2.5a2.5 2.5 0 0 1 2.5-2.5h3.5z"/><path fill="#ECB22E" d="M19 29a2.5 2.5 0 0 1 0 5h-2.5V31.5A2.5 2.5 0 0 1 19 29zm6 5a2.5 2.5 0 0 1-5 0V28h2.5a2.5 2.5 0 0 1 2.5 2.5V34z"/></svg>`,
    defaultCapabilities: {
      alert_handover: true,
      alert_appointment: true,
    },
    capabilityLabels: {
      alert_handover: {
        label: "Alerta de Traspaso a Humano",
        desc: "Avisa al canal con botón de acceso cuando un paciente pide una persona o declara urgencia.",
      },
      alert_appointment: {
        label: "Alerta de Nueva Cita",
        desc: "Publica un mensaje con los datos del paciente y el servicio reservado.",
      },
    },
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Cobra señales y anticipos de citas mediante enlaces de pago seguros de Stripe Checkout.",
    category: "payments",
    authType: "api_key",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><rect width="48" height="48" rx="8" fill="#635BFF"/><path fill="#FFF" d="M22.5 20.3c0-1.6 1.3-2.2 3.4-2.2 3.1 0 6.9 1 9.9 2.7V13c-3.2-1.3-6.7-1.8-10.1-1.8-8.1 0-13.6 4.3-13.6 11.5 0 11.2 15.4 9.4 15.4 14.3 0 1.9-1.6 2.5-3.9 2.5-3.6 0-8.2-1.5-11.8-3.5v8c3.9 1.7 8 2.5 12.1 2.5 8.3 0 14.1-4.1 14.1-11.6-.1-11.7-15.5-9.8-15.5-14.7z"/></svg>`,
    defaultCapabilities: {
      deposit_required: true,
    },
    capabilityLabels: {
      deposit_required: {
        label: "Solicitar seña para citas",
        desc: "Permite al asistente generar y enviar un link de pago con el importe configurado.",
      },
    },
  },
  {
    id: "webhooks",
    name: "Webhooks Salientes",
    description: "Conecta n8n, Make, Zapier o sistemas propios enviando eventos firmados con HMAC SHA-256.",
    category: "automation",
    authType: "custom",
    logoSvg: `<svg viewBox="0 0 48 48" width="100%" height="100%"><rect width="48" height="48" rx="8" fill="#0F172A"/><path fill="#38BDF8" d="M26 4L10 26h12l-2 18 18-24H24l2-16z"/></svg>`,
    defaultCapabilities: {
      event_chat_created: true,
      event_appointment_created: true,
      event_handover: true,
      event_contact_created: true,
    },
    capabilityLabels: {
      event_chat_created: {
        label: "Conversación nueva iniciada",
        desc: "Dispara `conversation.created` con el canal y contacto.",
      },
      event_appointment_created: {
        label: "Cita creada por la IA",
        desc: "Dispara `appointment.created` con fecha, hora y servicio.",
      },
      event_handover: {
        label: "Traspaso a una persona",
        desc: "Dispara `handover.triggered` con el motivo y resumen.",
      },
      event_contact_created: {
        label: "Nuevo contacto registrado",
        desc: "Dispara `contact.created` para sincronización con CRM.",
      },
    },
  },
];
