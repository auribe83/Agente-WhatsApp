import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atiende — Asistente de IA para tu Negocio",
  description: "Atención al cliente automatizada por WhatsApp y Chat Web con citas en Google Calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
