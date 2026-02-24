import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LeadsView } from '../../views/LeadsView';
import { FeedbackView } from '../../views/FeedbackView';
import { TicketsView } from '../../views/TicketsView';
import './Layout.css';

/**
 * AppLayout: Sidebar (persistent) + RouterView.
 * Tickets, Leads, Feedback = embedded iframes. Calls = default view.
 */
export function Layout() {
  const { pathname } = useLocation();

  const content =
    pathname.startsWith('/tickets') ? <TicketsView key="tickets" /> :
    pathname.startsWith('/leads') ? <LeadsView key="leads" /> :
    pathname.startsWith('/feedback') ? <FeedbackView key="feedback" /> :
    <Outlet />;

  const viewName =
    pathname.startsWith('/tickets') ? 'TicketsView' :
    pathname.startsWith('/leads') ? 'LeadsView' :
    pathname.startsWith('/feedback') ? 'FeedbackView' :
    'Outlet (Calls/default)';

  console.log('[Layout] pathname:', pathname, '| rendering:', viewName);

  return (
    <div className="unified-layout">
      <header className="unified-header">
        <div className="header-title">
          <h1>Call Intelligence</h1>
        </div>
      </header>
      <div className="unified-body">
        <Sidebar />
        <main className="unified-main">
          {content}
        </main>
      </div>
    </div>
  );
}
