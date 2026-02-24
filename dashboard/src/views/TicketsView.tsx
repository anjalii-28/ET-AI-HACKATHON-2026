import { EmbeddedFrame } from '../components/layout/EmbeddedFrame';
import { EXTERNAL_APP_URLS } from '../config';

/**
 * Tickets view: Chatwoot embedded via iframe at http://localhost.
 * Sidebar remains visible.
 */
export function TicketsView() {
  return (
    <EmbeddedFrame
      src={EXTERNAL_APP_URLS.CHATWOOT}
      title="Tickets - Chatwoot"
    />
  );
}
