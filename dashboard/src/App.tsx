import { useState, useEffect } from 'react';
import { CallData } from './types';
import { loadCallData, calculateStats } from './utils/dataLoader';
import { ProcessingOverview } from './components/ProcessingOverview';
import { CallList } from './components/CallList';
import { CallDetail } from './components/CallDetail';
import './App.css';

function App() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await loadCallData();
        // Add filename if not present (for display purposes)
        const dataWithFilenames = data.map((call, index) => ({
          ...call,
          filename: call.filename || `call_${index + 1}.json`,
        }));
        setCalls(dataWithFilenames);
      } catch (error) {
        console.error('Error loading call data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = calculateStats(calls);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading call data...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Call Processing Report Dashboard</h1>
            <p className="subtitle">Intelligence reports for processed calls</p>
          </div>
          <div className="header-search">
            <input
              type="text"
              className="global-search-input"
              placeholder="Search transcript, notes, names, department, services, filename…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <ProcessingOverview stats={stats} />
        <CallList calls={calls} onCallSelect={setSelectedCall} searchQuery={searchQuery} />
      </main>

      {selectedCall && (
        <CallDetail call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}

export default App;
