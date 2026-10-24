import { getValidAccessToken } from "./oauth";
import { prisma } from "@/lib/prisma";

export async function createOrGetContactsSheet(): Promise<{ spreadsheetId: string; url: string }> {
  const token = await getValidAccessToken("google_sheets");
  const config = await prisma.integrationConfig.findUnique({ where: { id: "google_sheets" } });
  const settings = (config?.settings as Record<string, any>) || {};

  if (settings.spreadsheetId && settings.url) {
    return { spreadsheetId: settings.spreadsheetId, url: settings.url };
  }

  const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const title = `Contactos — ${business?.name || "Atiende"}`;

  // Crear la hoja de cálculo usando Google Sheets API v4
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: "Contactos" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "Fecha Registro" } },
                    { userEnteredValue: { stringValue: "Nombre" } },
                    { userEnteredValue: { stringValue: "Teléfono" } },
                    { userEnteredValue: { stringValue: "Canal" } },
                    { userEnteredValue: { stringValue: "Tratamiento de Interés" } },
                    { userEnteredValue: { stringValue: "¿Pidió Cita?" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Error al crear Google Sheet: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const url = sheetData.spreadsheetUrl;

  // Guardar en la configuración de la integración
  await prisma.integrationConfig.update({
    where: { id: "google_sheets" },
    data: {
      settings: {
        ...settings,
        spreadsheetId,
        url,
      },
    },
  });

  return { spreadsheetId, url };
}

export async function appendContactToSheet(data: {
  date: string;
  name: string;
  phone: string;
  channel: string;
  interest: string;
  hasAppointment: boolean;
}) {
  const { spreadsheetId } = await createOrGetContactsSheet();
  const token = await getValidAccessToken("google_sheets");

  const row = [
    data.date,
    data.name,
    data.phone,
    data.channel,
    data.interest,
    data.hasAppointment ? "SÍ" : "NO",
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Contactos!A:F:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.text();
    throw new Error(`Error al agregar fila en Google Sheets: ${err}`);
  }

  return appendRes.json();
}
