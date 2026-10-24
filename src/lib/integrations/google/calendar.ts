import { getValidAccessToken } from "./oauth";
import { prisma } from "@/lib/prisma";

export interface CalendarEventPayload {
  clientName: string;
  clientPhone?: string;
  serviceName: string;
  startDateTime: string; // ISO string
  durationMinutes: number;
  calendarId?: string;
}

export async function listUserCalendars(): Promise<Array<{ id: string; summary: string; primary: boolean }>> {
  const token = await getValidAccessToken("google_calendar");

  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener la lista de calendarios de Google.");
  }

  const data = await res.json();
  return (data.items || []).map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    primary: Boolean(cal.primary),
  }));
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  const token = await getValidAccessToken("google_calendar");

  // Obtener calendarId configurado o "primary"
  const config = await prisma.integrationConfig.findUnique({ where: { id: "google_calendar" } });
  const settings = (config?.settings as Record<string, any>) || {};
  const calendarId = payload.calendarId || settings.calendarId || "primary";

  const start = new Date(payload.startDateTime);
  const end = new Date(start.getTime() + payload.durationMinutes * 60 * 1000);

  const eventBody = {
    summary: `${payload.clientName} — ${payload.serviceName}`,
    description: `Servicio: ${payload.serviceName}\nPaciente: ${payload.clientName}\nTeléfono: ${
      payload.clientPhone || "No especificado"
    }\n\n[Creada por Atiende]`,
    start: {
      dateTime: start.toISOString(),
      timeZone: "America/Caracas",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "America/Caracas",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de Google Calendar al crear evento: ${err}`);
  }

  const created = await res.json();
  return {
    id: created.id,
    htmlLink: created.htmlLink,
    start: created.start.dateTime,
    end: created.end.dateTime,
  };
}

export async function deleteCalendarEvent(eventId: string, calendarId = "primary") {
  const token = await getValidAccessToken("google_calendar");

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error("No se pudo eliminar el evento en Google Calendar");
  }

  return { success: true };
}
