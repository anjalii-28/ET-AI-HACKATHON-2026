import './EmbeddedFrame.css';

/** Leads iframe URL: Twenty CRM (direct iframe from port 3002 - Twenty allows iframe embedding). */
const LEADS_IFRAME_SRC = 'http://localhost:3002';

interface EmbeddedFrameProps {
  /** URL to load in the iframe (optional; defaults to LEADS_IFRAME_SRC for Leads view) */
  src?: string;
  /** Optional title for accessibility */
  title?: string;
}

/**
 * Full-height, borderless iframe for embedding external apps (Chatwoot/Tickets, Twenty/Leads).
 * Blocks recursive loads (dashboard loading itself) but allows same-origin apps at different paths.
 */
export function EmbeddedFrame({ src = LEADS_IFRAME_SRC, title = 'Embedded content' }: EmbeddedFrameProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Block if trying to load dashboard routes (/app paths)
  // Allow http://localhost (Chatwoot root) and http://localhost:3002 (Twenty) - different origins/ports are fine
  const isRecursive =
    typeof window !== 'undefined' &&
    (src === origin + '/app' ||
     src === origin + '/app/' ||
     src.startsWith(origin + '/app/tickets') ||
     src.startsWith(origin + '/app/leads') ||
     src.startsWith(origin + '/app/feedback') ||
     src.startsWith(origin + '/app/calls') ||
     (src.startsWith('/app') && !src.includes('..'))); // Block relative /app paths

  if (typeof window !== 'undefined') {
    console.log('[EmbeddedFrame] src:', src, '| origin:', origin, '| isRecursive:', isRecursive);
    if (isRecursive) {
      console.error('[EmbeddedFrame] Iframe attempting to load dashboard itself — blocked');
    }
  }

  const safeSrc = isRecursive ? 'about:blank' : src;

  return (
    <div className="embedded-frame-container">
      <iframe
        src={safeSrc}
        title={title}
        className="embedded-frame"
        frameBorder={0}
        allowFullScreen
      />
    </div>
  );
}
