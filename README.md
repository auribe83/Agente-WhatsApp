# Atiende — Asistente de IA para Negocios Locales

«Atiende» es una aplicación integral diseñada para agencias que instalan asistentes de IA en negocios locales. Atiende a los clientes por WhatsApp y mediante un chat web embebible, responde con información del negocio, agenda citas en Google Calendar, notifica al equipo humano y transfiere la conversación cuando es necesario.

Toda la interfaz está configurada en **español de Venezuela** y zona horaria **America/Caracas (Venezuela)**.

---

## 🚀 Requisitos y Arranque Rápido

No necesitas instalar PostgreSQL ni Docker en tu máquina local si no lo deseas: el sistema incluye una base de datos PostgreSQL local embebida de alta fidelidad basada en PGlite que corre en un puerto TCP estándar (5433).

### 1. Clonar y configurar entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

### 2. Arrancar la aplicación completa
Un solo comando arranca la base de datos local, sincroniza el esquema con Prisma, siembra los datos de prueba de la **Clínica Dental Riky**, arranca el proceso worker y el servidor Next.js:

```bash
npm run dev
```

La aplicación estará disponible de inmediato en:
👉 **http://localhost:3000**

---

## 🔐 Credenciales de Acceso Inicial
- **Correo:** `admin@atiende.local`
- **Contraseña:** `AdminPassword2026*`

---

## 📋 Estructura de Pantallas (Fase 1)
1. **Resumen (`/`)**: Interruptor de encendido/pausa, métricas clave en vivo (conversaciones, citas, esperas), estado de canales e integraciones.
2. **Comportamiento (`/comportamiento`)**: Nombre, avatar, tono (cercano, profesional, directo), mensaje de bienvenida, límites y reglas infranqueables, matriz de horario semanal y modal interactivo para inspeccionar el prompt completo de IA.
3. **Conocimiento (`/conocimiento`)**: Ficha del negocio, catálogo de 8 servicios odontológicos, 10 preguntas frecuentes y herramienta inteligente **«Importar desde una web»**.
4. **Integraciones (`/integraciones`)**: Catálogo modular de 6 herramientas (Google Calendar, Gmail, Sheets, Slack, Stripe, Webhooks).
5. **Canales (`/canales`)**: WhatsApp (Baileys) y Chat Web.
6. **Probar (`/probar`)**: Simulador interactivo de cliente con visor de tools en tiempo real.
7. **Conversaciones (`/conversaciones`)**: Bandeja con historial precargado y filtro de soporte humano.
8. **Actividad (`/actividad`)**: Registro de auditoría de cada acción.
9. **Ajustes (`/ajustes`)**: Selector dinámico de modelos de OpenRouter con filtro de herramientas, calculadora de costes para 1.000 conversaciones/mes, marca blanca de agencia y miembros de equipo.
