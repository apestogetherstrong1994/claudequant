# ============================================================
# Intelligent Document Parser
# Reads scanned medical intake forms and extracts patient data
# ============================================================

import os
import sys
import json
import base64
import fitz  # PyMuPDF — converts PDF pages to images
from anthropic import Anthropic

# ---- Configuration ----
RECORDS_FILE = "patient_records.json"

# This is the prompt we send to Claude along with the form image.
# It tells Claude exactly what to look for and how to format the output.
EXTRACTION_PROMPT = """You are a medical document parser. You are looking at a scanned
medical intake form that was filled out by hand (or typed).

Extract ALL patient information you can find and return it as a JSON object.

Use this structure (include only fields that are actually present on the form):

{
  "first_name": "",
  "last_name": "",
  "date_of_birth": "",
  "gender": "",
  "phone": "",
  "email": "",
  "address": "",
  "emergency_contact_name": "",
  "emergency_contact_phone": "",
  "insurance_provider": "",
  "insurance_id": "",
  "allergies": [],
  "current_medications": [],
  "medical_conditions": [],
  "reason_for_visit": "",
  "additional_notes": ""
}

Rules:
- Return ONLY the JSON object, no other text.
- If a field is empty or unreadable, omit it from the JSON.
- For lists (allergies, medications, conditions), return an array of strings.
- Normalize dates to YYYY-MM-DD format when possible.
- Do your best with messy handwriting — make reasonable guesses but note uncertainty.
"""


def pdf_to_images(pdf_path):
    """
    Convert each page of a PDF into a PNG image.
    Returns a list of (page_number, image_bytes) tuples.
    """
    doc = fitz.open(pdf_path)
    images = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # Render at 2x resolution for better OCR quality
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")
        images.append((page_num + 1, img_bytes))
        print(f"  Converted page {page_num + 1} of {len(doc)}")

    doc.close()
    return images


def extract_patient_data(image_bytes, client):
    """
    Send a form image to Claude's Vision API and get structured patient data back.
    """
    # Convert image bytes to base64 (required by the API)
    img_base64 = base64.b64encode(image_bytes).decode("utf-8")

    # Call Claude with the image
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": img_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": EXTRACTION_PROMPT,
                    },
                ],
            }
        ],
    )

    # Parse the JSON from Claude's response
    response_text = message.content[0].text.strip()

    # Sometimes Claude wraps JSON in ```json ... ``` markers — strip those
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]  # remove first line
        response_text = response_text.rsplit("```", 1)[0]  # remove last ```

    return json.loads(response_text)


def load_records():
    """Load existing patient records from disk."""
    try:
        with open(RECORDS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_records(records):
    """Save all patient records to disk."""
    with open(RECORDS_FILE, "w") as f:
        json.dump(records, f, indent=2)


def display_record(record, index=None):
    """Pretty-print a single patient record."""
    header = f"Patient #{index}" if index is not None else "Patient Record"
    print(f"\n{'=' * 40}")
    print(f"  {header}")
    print(f"{'=' * 40}")

    for key, value in record.items():
        if key == "source_file":
            continue  # skip internal metadata
        # Make the key name readable: "first_name" -> "First Name"
        label = key.replace("_", " ").title()
        if isinstance(value, list):
            value = ", ".join(value) if value else "None"
        print(f"  {label:.<30} {value}")

    print(f"{'=' * 40}")


def process_pdf(pdf_path, client):
    """
    Main pipeline: PDF -> Images -> Claude Vision -> Patient Record
    """
    print(f"\nProcessing: {pdf_path}")
    print("-" * 40)

    # Step 1: Convert PDF to images
    print("Step 1: Converting PDF to images...")
    images = pdf_to_images(pdf_path)
    print(f"  Got {len(images)} page(s)")

    # Step 2: Send each page to Claude for extraction
    print("Step 2: Extracting patient data with AI...")
    all_data = {}

    for page_num, img_bytes in images:
        print(f"  Analyzing page {page_num}...")
        page_data = extract_patient_data(img_bytes, client)
        # Merge data from multiple pages (later pages overwrite if duplicate keys)
        all_data.update(page_data)

    # Add metadata
    all_data["source_file"] = os.path.basename(pdf_path)

    # Step 3: Save the record
    print("Step 3: Saving patient record...")
    records = load_records()
    records.append(all_data)
    save_records(records)

    return all_data


# ============================================================
# Main CLI Interface
# ============================================================

def main():
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable is not set.")
        print()
        print("To set it, run:")
        print('  export ANTHROPIC_API_KEY="sk-ant-your-key-here"')
        print()
        print("Get a key at: https://console.anthropic.com")
        sys.exit(1)

    client = Anthropic()

    print("=== Intelligent Document Parser ===")
    print("Parse scanned medical intake forms into digital records.\n")

    while True:
        print("\nWhat would you like to do?")
        print("  1. Parse a new form (PDF)")
        print("  2. View all patient records")
        print("  3. Search records by name")
        print("  4. Quit")

        choice = input("\nEnter 1-4: ").strip()

        if choice == "1":
            pdf_path = input("Enter path to PDF file: ").strip()
            # Remove quotes if user dragged file into terminal
            pdf_path = pdf_path.strip("'\"")

            if not os.path.exists(pdf_path):
                print(f"File not found: {pdf_path}")
                continue

            if not pdf_path.lower().endswith(".pdf"):
                print("Please provide a PDF file.")
                continue

            try:
                record = process_pdf(pdf_path, client)
                print("\nExtracted record:")
                display_record(record)
                print("\nRecord saved successfully!")
            except Exception as e:
                print(f"\nError processing form: {e}")

        elif choice == "2":
            records = load_records()
            if not records:
                print("\nNo records yet. Parse a form first!")
            else:
                print(f"\n Found {len(records)} record(s):")
                for i, record in enumerate(records, 1):
                    display_record(record, index=i)

        elif choice == "3":
            search = input("Enter name to search: ").strip().lower()
            records = load_records()
            found = []
            for r in records:
                full_name = f"{r.get('first_name', '')} {r.get('last_name', '')}".lower()
                if search in full_name:
                    found.append(r)

            if found:
                print(f"\nFound {len(found)} matching record(s):")
                for i, record in enumerate(found, 1):
                    display_record(record, index=i)
            else:
                print(f"No records matching '{search}'.")

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main()
