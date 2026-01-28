import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
AUDIO_DIR = "audio"
OUTPUT_DIR = "output"

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env file or environment variables.")
    print("   Please add GEMINI_API_KEY to your .env file")
    raise ValueError("GEMINI_API_KEY not found")

# Initialize Gemini API client
# Use v1alpha API version for Gemini 2.0 Flash support
client = genai.Client(api_key=GEMINI_API_KEY, http_options={'api_version': 'v1alpha'})

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_timestamp_from_filename(filename):
    """Extract timestamp from filename if available."""
    # Try to extract timestamp from filename patterns
    # Example: in_8867065830_Sparsh_Emergency_Muthumari_1012_inbound_20251203134613.WAV
    import re
    # Look for YYYYMMDDHHMMSS pattern
    match = re.search(r'(\d{14})', filename)
    if match:
        ts_str = match.group(1)
        try:
            # Parse: YYYYMMDDHHMMSS
            dt = datetime.strptime(ts_str, "%Y%m%d%H%M%S")
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except:
            pass
    # Default to current timestamp
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def process_audio_file(audio_path):
    """Process a single audio file with Gemini API and extract entities."""
    print(f"\nProcessing: {audio_path.name}")
    
    audio_file = None
    response_text = None
    
    try:
        # Upload audio file
        print("  Uploading audio file...")
        audio_file = client.files.upload(file=str(audio_path))
        
        # Create prompt for entity extraction
        prompt = """Analyze this audio call transcript and extract the following information in JSON format:

{
  "source_type": "call",
  "call_classification": "TICKET_EXISTING_APPOINTMENT" | "TICKET_NEW_APPOINTMENT" | "TICKET_ENQUIRY" | "TICKET_COMPLAINT" | "LEAD_SERVICE_INQUIRY" | "LEAD_APPOINTMENT_BOOKING" | "OTHER",
  "recordType": "TICKET" | "LEAD",
  "notes": "Detailed summary of the call conversation",
  "ticket_solution": "How the call was resolved or what action was taken (for TICKET only)",
  "action_required": "ACTION_REQUIRED" | "NO_ACTION" | "FOLLOW_UP",
  "LeadNotes": null or "Notes for lead (for LEAD only)",
  "customer_name": "Name of the caller",
  "phone_number": "Phone number if mentioned",
  "location": "Location if mentioned",
  "department": "Department name if mentioned",
  "services": "Services inquired about",
  "follow_up_required": true | false,
  "timestamp": "ISO-8601 timestamp",
  "hospital_name": "Hospital name if mentioned",
  "doctor_name": "Doctor name if mentioned",
  "sentiment_label": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANXIOUS" | "FRUSTRATED",
  "sentiment_summary": "Brief sentiment analysis",
  "follow_ups": [
    {
      "doctor": "Doctor name for follow-up",
      "department": "Department for follow-up",
      "follow_up_time": "When follow-up is needed"
    }
  ]
}

Important:
- Return ONLY valid JSON, no markdown or extra text
- Use null for missing values (not "null" string)
- timestamp should be ISO-8601 format
- For TICKET: notes should contain full ticket summary, ticket_solution should explain resolution
- For LEAD: LeadNotes should contain lead-specific notes, notes can be general summary
- call_classification should be one of the specified values
- sentiment_label should be one of the specified values
- follow_ups should be an array (empty array if none)
"""

        # Generate response using gemini-2.0-flash (not gemini-2.0-flash-exp)
        print("  Sending to Gemini API...")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, audio_file]
        )
        
        # Parse JSON from response
        if not hasattr(response, 'text') or not response.text:
            print("  ERROR: No text response from API")
            return None
            
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON
        extracted_data = json.loads(response_text)
        
        # Add timestamp from filename if not present
        if not extracted_data.get("timestamp"):
            extracted_data["timestamp"] = extract_timestamp_from_filename(audio_path.name)
        
        # Ensure source_type is set
        if not extracted_data.get("source_type"):
            extracted_data["source_type"] = "call"
        
        print(f"  Successfully extracted entities")
        return extracted_data
        
    except json.JSONDecodeError as e:
        print(f"  ERROR: Error parsing JSON response: {e}")
        if response_text:
            print(f"  Response text: {response_text[:500]}")
        return None
    except Exception as e:
        print(f"  ERROR: Error processing file: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # Clean up uploaded file
        try:
            if audio_file and hasattr(audio_file, 'name'):
                client.files.delete(name=audio_file.name)
        except Exception as cleanup_error:
            print(f"  WARNING: Could not delete uploaded file: {cleanup_error}")
            pass

def main():
    print("Entity Extraction Script")
    print("=" * 50)
    print(f"Audio directory: {AUDIO_DIR}/")
    print(f"Output directory: {OUTPUT_DIR}/")
    print("=" * 50)
    
    # Check if audio directory exists
    if not os.path.exists(AUDIO_DIR):
        print(f"ERROR: Audio directory '{AUDIO_DIR}' not found!")
        print(f"   Please create the '{AUDIO_DIR}' folder and add your audio files there.")
        return
    
    # Find all audio files
    audio_files = list(Path(AUDIO_DIR).glob("*.wav")) + \
                  list(Path(AUDIO_DIR).glob("*.WAV")) + \
                  list(Path(AUDIO_DIR).glob("*.mp3")) + \
                  list(Path(AUDIO_DIR).glob("*.MP3"))
    
    if not audio_files:
        print(f"WARNING: No audio files found in {AUDIO_DIR}/")
        print("   Supported formats: .wav, .mp3")
        return
    
    print(f"\nFound {len(audio_files)} audio file(s) to process\n")
    
    success_count = 0
    failed_count = 0
    
    for audio_file in audio_files:
        # Process audio file
        extracted_data = process_audio_file(audio_file)
        
        if extracted_data:
            # Save to JSON file
            output_filename = audio_file.stem + ".json"
            output_path = Path(OUTPUT_DIR) / output_filename
            
            try:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(extracted_data, f, indent=2, ensure_ascii=False)
                print(f"  Saved to: {output_path}")
                success_count += 1
            except Exception as e:
                print(f"  ERROR: Error saving file: {e}")
                failed_count += 1
        else:
            failed_count += 1
    
    print("\n" + "=" * 50)
    print("Processing complete!")
    print(f"   Successfully processed: {success_count}")
    print(f"   Failed: {failed_count}")
    print(f"   JSON files saved in: {OUTPUT_DIR}/")
    print("=" * 50)

if __name__ == "__main__":
    main()
