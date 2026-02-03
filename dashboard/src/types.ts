export interface CallData {
  call_classification?: string;
  recordType?: 'LEAD' | 'TICKET' | 'TICKET_CONFUSION' | 'CONFUSION' | 'PRANK' | 'IVR' | 'NO_ACTION_REQUIRED';
  notes?: string;
  ticket_solution?: string;
  /** Lead notes (from extraction pipeline) */
  LeadNotes?: string | null;
  /** Ticket notes (from extraction pipeline) */
  ticket_notes?: string | null;
  /** How the call was resolved (from extraction pipeline) */
  call_solution?: string | null;
  /** Full transcript or full summary of the call (optional, from pipeline) */
  transcript?: string | null;
  action_required?: boolean | string;
  action_description?: string | null;
  /** Outcome: one word from allowed enum (CALLBACK, BOOKED, RESCHEDULED, INFORMATION CALL, FOLLOWUP, NOANSWER, DROPPED, ESCALATED, RESOLVED, CANCELLED, UNKNOWN) */
  outcome?: string | null;
  sentiment_label?: string;
  sentiment_summary?: string;
  follow_ups?: string[] | string;
  customer_name?: string;
  doctor_name?: string;
  hospital_name?: string;
  department?: string;
  services?: string;
  location?: string;
  timestamp?: string;
  filename?: string;
}

export interface ProcessingStats {
  total: number;
  lead: number;
  ticket: number;
}
