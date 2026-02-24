/**
 * Dashboard = http://localhost/app (reverse proxy).
 * Tickets = Chatwoot embedded in iframe at http://localhost (reverse proxy, sidebar remains visible).
 * Leads = Twenty embedded in iframe at http://localhost:3002 (direct iframe - Twenty allows iframe embedding).
 */
export const EXTERNAL_APP_URLS = {
  CHATWOOT: import.meta.env.VITE_CHATWOOT_URL ?? 'http://localhost',
  TWENTY: import.meta.env.VITE_TWENTY_URL ?? 'http://localhost:3002',
} as const;
