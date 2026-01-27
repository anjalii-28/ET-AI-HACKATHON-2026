export interface CallData {
  call_classification?: string;
  recordType?: 'LEAD' | 'TICKET' | 'TICKET_CONFUSION' | 'CONFUSION' | 'PRANK' | 'IVR' | 'NO_ACTION_REQUIRED';
  notes?: string;
  ticket_solution?: string;
  action_required?: boolean | string;
  sentiment_label?: string;
  sentiment_summary?: string;
  follow_ups?: string[] | string;
  customer_name?: string;
  doctor_name?: string;
  hospital_name?: string;
  department?: string;
  services?: string;
  timestamp?: string;
  filename?: string;
}

export interface ProcessingStats {
  total: number;
  lead: number;
  ticket: number;
}
