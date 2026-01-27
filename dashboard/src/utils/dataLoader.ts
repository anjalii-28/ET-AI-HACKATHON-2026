import { CallData } from '../types';

/**
 * Loads call data from JSON files in the public/data directory.
 * 
 * Reads ALL JSON files from the output folder (via manifest.json).
 * Each JSON file represents ONE processed call.
 * 
 * TICKET_CONFUSION is normalized to TICKET for display purposes.
 * Calls are sorted by timestamp (latest first).
 */
export async function loadCallData(): Promise<CallData[]> {
  console.log('Loading call data...');

  try {
    // Load manifest file that lists all JSON files from output folder
    const manifestResponse = await fetch('/data/manifest.json');
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log(`Manifest loaded: ${manifest.totalFiles || 0} files listed`);
      
      if (Array.isArray(manifest.files)) {
        console.log(`Loading ${manifest.files.length} file(s) from manifest...`);
        
        // Load each file listed in manifest
        const filePromises = manifest.files.map(async (filename: string) => {
          try {
            const response = await fetch(`/data/${filename}`);
            if (response.ok) {
              const callData = await response.json();
              // Normalize TICKET_CONFUSION to TICKET (UI-only normalization, not filtering)
              const normalizedRecordType = normalizeRecordType(callData.recordType);
              return {
                ...callData,
                recordType: normalizedRecordType,
                filename: filename,
              };
            } else {
              console.warn(`Failed to load ${filename}: HTTP ${response.status}`);
            }
          } catch (error) {
            console.warn(`Failed to load ${filename}:`, error);
          }
          return null;
        });

        const loadedCalls = await Promise.all(filePromises);
        const validCalls = loadedCalls.filter((call): call is CallData => call !== null);
        
        console.log(`Successfully loaded ${validCalls.length} of ${manifest.files.length} file(s)`);
        
        // Sort by timestamp (latest first)
        validCalls.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });
        
        console.log(`Final call count: ${validCalls.length}`);
        return validCalls;
      }
    }
  } catch (error) {
    console.warn('Could not load manifest.json:', error);
    console.warn('   Trying fallback...');
  }

  // Fallback: Try loading single consolidated file (only if manifest failed)
  console.warn('Manifest not found, trying fallback...');
  try {
    const singleFileResponse = await fetch('/data/calls.json');
    if (singleFileResponse.ok) {
      const data = await singleFileResponse.json();
      const callArray = Array.isArray(data) ? data : [data];
      console.log(`Using fallback calls.json with ${callArray.length} call(s)`);
      // Normalize and add filename
      return callArray.map((call, index) => ({
        ...call,
        recordType: normalizeRecordType(call.recordType),
        filename: call.filename || `call_${index + 1}.json`,
      }));
    }
  } catch (error) {
    console.warn('Could not load /data/calls.json');
  }

  // Return empty array if no data found
  console.error('No call data found. Run "npm run load-data" to load files from output folder.');
  return [];
}

/**
 * Normalizes recordType: TICKET_CONFUSION becomes TICKET
 */
function normalizeRecordType(recordType?: string): CallData['recordType'] {
  if (!recordType) return undefined;
  const upper = recordType.toUpperCase();
  if (upper === 'TICKET_CONFUSION' || upper === 'CONFUSION') {
    return 'TICKET';
  }
  return upper as CallData['recordType'];
}

export function calculateStats(calls: CallData[]): {
  total: number;
  lead: number;
  ticket: number;
} {
  const stats = {
    total: calls.length,
    lead: 0,
    ticket: 0,
  };

  calls.forEach((call) => {
    const recordType = call.recordType?.toUpperCase();
    if (recordType === 'LEAD') {
      stats.lead++;
    } else if (recordType === 'TICKET' || recordType === 'TICKET_CONFUSION' || recordType === 'CONFUSION') {
      // TICKET_CONFUSION is treated as TICKET
      stats.ticket++;
    }
    // Other types (PRANK, IVR, NO_ACTION_REQUIRED) are not counted separately
  });

  return stats;
}
