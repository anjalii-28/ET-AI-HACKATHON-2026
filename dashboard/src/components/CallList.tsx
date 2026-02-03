import { CallData } from '../types';
import { useState, useMemo } from 'react';

interface CallListProps {
  calls: CallData[];
  onCallSelect: (call: CallData) => void;
  searchQuery: string;
}

type FilterType = 'ALL' | 'LEAD' | 'TICKET';
type SortType = 'timestamp-desc' | 'timestamp-asc' | 'action-required';

// Extract call category from filename
function extractCallCategory(filename?: string): string {
  if (!filename) return 'OTHER';
  
  const upper = filename.toUpperCase();
  
  // Check for known patterns in filename
  if (upper.includes('POST_DISCHARGE') || upper.includes('POSTDISCHARGE')) {
    return 'POST_DISCHARGE';
  }
  if (upper.includes('EMERGENCY')) {
    return 'EMERGENCY';
  }
  if (upper.includes('HOMECARE') || upper.includes('HOME_CARE')) {
    return 'CUSTOMER_CARE';
  }
  if (upper.includes('APPOINTMENT') || upper.includes('APPT')) {
    return 'APPOINTMENT';
  }
  if (upper.includes('CUSTOMER_CARE') || upper.includes('CUSTOMERCARE')) {
    return 'CUSTOMER_CARE';
  }
  
  // Default to OTHER if no category found
  return 'OTHER';
}

export function CallList({ calls, onCallSelect, searchQuery }: CallListProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortType>('timestamp-desc');
  const [actionRequiredFilter, setActionRequiredFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [callClassificationFilter, setCallClassificationFilter] = useState<string>('ALL');
  const [sentimentFilter, setSentimentFilter] = useState<string>('ALL');
  const [hospitalFilter, setHospitalFilter] = useState<string>('ALL');
  const [callCategoryFilter, setCallCategoryFilter] = useState<string>('ALL');

  // Extract unique values for dynamic filters
  const uniqueValues = useMemo(() => {
    const classifications = new Set<string>();
    const sentiments = new Set<string>();
    const hospitals = new Set<string>();
    const categories = new Set<string>();

    calls.forEach((call) => {
      if (call.call_classification) {
        classifications.add(call.call_classification);
      }
      if (call.sentiment_label) {
        sentiments.add(call.sentiment_label);
      }
      if (call.hospital_name) {
        hospitals.add(call.hospital_name);
      }
      // Extract category from filename
      const category = extractCallCategory(call.filename);
      categories.add(category);
    });

    // Sort categories in a specific order
    const categoryOrder = ['APPOINTMENT', 'CUSTOMER_CARE', 'EMERGENCY', 'POST_DISCHARGE', 'OTHER'];
    const sortedCategories = Array.from(categories).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return {
      classifications: Array.from(classifications).sort(),
      sentiments: Array.from(sentiments).sort(),
      hospitals: Array.from(hospitals).sort(),
      categories: sortedCategories,
    };
  }, [calls]);

  const filteredAndSortedCalls = useMemo(() => {
    let filtered = [...calls];

    // Filter by recordType (TICKET_CONFUSION is treated as TICKET)
    if (filter !== 'ALL') {
      filtered = filtered.filter((call) => {
        const recordType = call.recordType?.toUpperCase();
        if (filter === 'TICKET') {
          return recordType === 'TICKET' || recordType === 'TICKET_CONFUSION' || recordType === 'CONFUSION';
        }
        return recordType === filter;
      });
    }

    // Filter by action required
    if (actionRequiredFilter === 'YES') {
      filtered = filtered.filter((call) => {
        const actionReq = call.action_required;
        if (typeof actionReq === 'boolean') {
          return actionReq === true;
        }
        if (typeof actionReq === 'string') {
          const upper = String(actionReq).trim().toUpperCase();
          // Check for various "action required" patterns
          // CALLBACK_REQUIRED should definitely match
          return (
            upper === 'TRUE' ||
            upper === 'YES' ||
            upper === 'CALLBACK_REQUIRED' ||
            upper === 'ACTION_REQUIRED' ||
            upper === 'REQUIRED' ||
            upper.includes('REQUIRED') ||
            upper.includes('CALLBACK') ||
            (upper.includes('ACTION') && !upper.includes('NO_ACTION'))
          );
        }
        return false;
      });
    } else if (actionRequiredFilter === 'NO') {
      filtered = filtered.filter((call) => {
        const actionReq = call.action_required;
        if (typeof actionReq === 'boolean') {
          return actionReq === false;
        }
        if (typeof actionReq === 'string') {
          const upper = String(actionReq).trim().toUpperCase();
          // Check for various "no action" patterns
          return (
            upper === 'FALSE' ||
            upper === 'NO' ||
            upper === 'NO_ACTION' ||
            upper === 'NO_ACTION_REQUIRED' ||
            upper === 'NONE' ||
            upper.includes('NO_ACTION')
          );
        }
        // undefined/null treated as no action
        return !actionReq;
      });
    }

    // Filter by call_classification
    if (callClassificationFilter !== 'ALL') {
      filtered = filtered.filter((call) => call.call_classification === callClassificationFilter);
    }

    // Filter by sentiment_label
    if (sentimentFilter !== 'ALL') {
      filtered = filtered.filter((call) => call.sentiment_label === sentimentFilter);
    }

    // Filter by hospital_name
    if (hospitalFilter !== 'ALL') {
      filtered = filtered.filter((call) => call.hospital_name === hospitalFilter);
    }

    // Filter by call category
    if (callCategoryFilter !== 'ALL') {
      filtered = filtered.filter((call) => {
        const category = extractCallCategory(call.filename);
        return category === callCategoryFilter;
      });
    }

    // Apply search query (case-insensitive) across all text fields so we can find everything
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const terms = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((call) => {
        const searchFields: (string | undefined | null)[] = [
          call.notes,
          call.LeadNotes,
          call.ticket_notes,
          call.call_solution,
          call.ticket_solution,
          call.transcript,
          call.sentiment_summary,
          call.customer_name,
          call.doctor_name,
          call.hospital_name,
          call.department,
          call.services,
          call.call_classification,
          call.filename,
          call.location,
          call.action_description,
        ];
        const searchableText = searchFields
          .filter((f) => f != null && String(f).trim() !== '')
          .map((f) => String(f).toLowerCase())
          .join(' ');
        return terms.every((term) => searchableText.includes(term));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp-desc') {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      } else if (sortBy === 'timestamp-asc') {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      } else if (sortBy === 'action-required') {
        const aAction = a.action_required === true || a.action_required === 'true' || a.action_required === 'yes' || a.action_required === 'YES';
        const bAction = b.action_required === true || b.action_required === 'true' || b.action_required === 'yes' || b.action_required === 'YES';
        return aAction === bAction ? 0 : aAction ? -1 : 1;
      }
      return 0;
    });

    return filtered;
  }, [calls, filter, sortBy, actionRequiredFilter, callClassificationFilter, sentimentFilter, hospitalFilter, callCategoryFilter, searchQuery]);

  const getSentimentColor = (sentiment?: string): string => {
    if (!sentiment) return '#666';
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s.includes('happy')) return '#10b981';
    if (s.includes('negative') || s.includes('angry') || s.includes('frustrated')) return '#ef4444';
    if (s.includes('neutral')) return '#6b7280';
    return '#f59e0b';
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getRecordTypeClass = (recordType?: string): string => {
    if (!recordType) return 'unknown';
    const upper = recordType.toUpperCase();
    if (upper === 'TICKET' || upper === 'TICKET_CONFUSION' || upper === 'CONFUSION') {
      return 'ticket';
    }
    return recordType.toLowerCase();
  };

  const getDisplayRecordType = (recordType?: string): string => {
    if (!recordType) return 'UNKNOWN';
    const upper = recordType.toUpperCase();
    if (upper === 'TICKET_CONFUSION' || upper === 'CONFUSION') {
      return 'TICKET';
    }
    return recordType;
  };

  return (
    <div className="call-list-section">
      <div className="filters-bar">
        <div className="filters-row">
          <div className="filter-group">
            <label>Record Type:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}>
              <option value="ALL">All</option>
              <option value="LEAD">Lead</option>
              <option value="TICKET">Ticket</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Action Required:</label>
            <select value={actionRequiredFilter} onChange={(e) => setActionRequiredFilter(e.target.value as 'ALL' | 'YES' | 'NO')}>
              <option value="ALL">All</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Classification:</label>
            <select value={callClassificationFilter} onChange={(e) => setCallClassificationFilter(e.target.value)}>
              <option value="ALL">All</option>
              {uniqueValues.classifications.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sentiment:</label>
            <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
              <option value="ALL">All</option>
              {uniqueValues.sentiments.map((sentiment) => (
                <option key={sentiment} value={sentiment}>
                  {sentiment}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Hospital:</label>
            <select value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
              <option value="ALL">All</option>
              {uniqueValues.hospitals.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Call Category:</label>
            <select value={callCategoryFilter} onChange={(e) => setCallCategoryFilter(e.target.value)}>
              <option value="ALL">All</option>
              {uniqueValues.categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)}>
              <option value="timestamp-desc">Latest First</option>
              <option value="timestamp-asc">Oldest First</option>
              <option value="action-required">Action Required First</option>
            </select>
          </div>
        </div>

        <div className="results-count">
          Showing {filteredAndSortedCalls.length} of {calls.length} calls
          {searchQuery.trim() && ` (filtered by search)`}
        </div>
      </div>

      <div className="call-list">
        {filteredAndSortedCalls.length === 0 ? (
          <div className="empty-state">
            {searchQuery.trim() 
              ? 'No calls match your search and filters.' 
              : 'No calls match the selected filters.'}
          </div>
        ) : (
          filteredAndSortedCalls.map((call, index) => {
            const actionRequired = call.action_required === true || call.action_required === 'true' || call.action_required === 'yes' || call.action_required === 'YES';
            const callKey = call.filename || `call-${index}`;
            return (
              <div
                key={callKey}
                className={`call-row ${actionRequired ? 'action-required' : ''}`}
                onClick={() => onCallSelect(call)}
              >
                <div className="call-row-main">
                  <div className="call-filename">{call.filename || `Call ${index + 1}`}</div>
                  <div className="call-metadata">
                    <span className={`record-type-badge ${getRecordTypeClass(call.recordType)}`}>
                      {getDisplayRecordType(call.recordType)}
                    </span>
                    {call.call_classification && (
                      <span className="classification-badge">{call.call_classification}</span>
                    )}
                    {actionRequired && (
                      <span className="action-badge">ACTION REQUIRED</span>
                    )}
                    {call.outcome && (
                      <span className="outcome-badge">{call.outcome}</span>
                    )}
                  </div>
                </div>
                <div className="call-row-details">
                  <div className="sentiment-indicator">
                    <span
                      className="sentiment-dot"
                      style={{ backgroundColor: getSentimentColor(call.sentiment_label) }}
                    />
                    <span>{call.sentiment_label || 'Unknown'}</span>
                  </div>
                  <div className="call-timestamp">{formatTimestamp(call.timestamp)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
