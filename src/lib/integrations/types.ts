export type IntegrationId =
  | "google_calendar"
  | "gmail"
  | "google_sheets"
  | "slack"
  | "stripe"
  | "webhooks";

export type IntegrationStatus = "DISCONNECTED" | "CONNECTED" | "ERROR";

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
  logoSvg: string; // SVG limpio oficial
  category: "google" | "comms" | "payments" | "automation";
  authType: "oauth_google" | "api_key" | "webhook_url" | "custom";
  defaultCapabilities: Record<string, boolean>;
  capabilityLabels: Record<string, { label: string; desc: string }>;
}
