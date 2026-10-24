import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isAlive = true;

      const sendUpdate = async () => {
        try {
          const config = await prisma.channelConfig.findUnique({
            where: { id: "whatsapp" },
          });

          const payload = {
            status: config?.status || "DISCONNECTED",
            qrCode: config?.qrCode || null,
            accountDetails: config?.accountDetails || null,
            updatedAt: config?.updatedAt || new Date(),
          };

          const sseData = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (e) {
          // Ignorar errores al cerrar stream
        }
      };

      // Enviar de inmediato
      await sendUpdate();

      // Intervalo de sondeo rápido para streaming reactivo
      const interval = setInterval(async () => {
        if (!isAlive) {
          clearInterval(interval);
          return;
        }
        await sendUpdate();
      }, 2000);

      request.signal.addEventListener("abort", () => {
        isAlive = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
