import { ProcessingStats } from '../types';

interface ProcessingOverviewProps {
  stats: ProcessingStats;
}

export function ProcessingOverview({ stats }: ProcessingOverviewProps) {
  return (
    <div className="overview-section">
      <h2>Processing Overview</h2>
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Calls Processed</div>
        </div>
        <div className="stat-card lead">
          <div className="stat-value">{stats.lead}</div>
          <div className="stat-label">Leads</div>
        </div>
        <div className="stat-card ticket">
          <div className="stat-value">{stats.ticket}</div>
          <div className="stat-label">Tickets</div>
        </div>
      </div>
    </div>
  );
}
