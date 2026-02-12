"""
Creates a sample medical intake form PDF that looks like a hand-filled form.
This gives us something to test the parser with.
"""

import fitz  # PyMuPDF can also CREATE PDFs

def create_sample_form(output_path="sample_intake_form.pdf"):
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # Letter size

    # --- Header ---
    page.insert_text((180, 40), "PATIENT INTAKE FORM", fontsize=18, fontname="helv")
    page.insert_text((190, 60), "Springfield Medical Clinic", fontsize=11, fontname="helv")
    page.draw_line((50, 70), (562, 70))

    # --- Helper to draw a label + handwritten-style answer ---
    y = 100

    def field(label, value, y_pos):
        # Label in clean font
        page.insert_text((50, y_pos), label, fontsize=10, fontname="helv")
        # "Handwritten" answer in italic (simulates handwriting)
        page.insert_text((220, y_pos), value, fontsize=11, fontname="hebi",
                        color=(0, 0, 0.6))
        # Underline
        page.draw_line((218, y_pos + 3), (550, y_pos + 3),
                       color=(0.7, 0.7, 0.7), width=0.5)
        return y_pos + 30

    # --- Patient Information ---
    page.insert_text((50, y), "PATIENT INFORMATION", fontsize=12, fontname="hebo")
    y += 25

    y = field("First Name:", "Maria", y)
    y = field("Last Name:", "Gonzalez", y)
    y = field("Date of Birth:", "03/15/1988", y)
    y = field("Gender:", "Female", y)
    y = field("Phone:", "(555) 867-5309", y)
    y = field("Email:", "maria.gonzalez@email.com", y)
    y = field("Address:", "742 Evergreen Terrace, Springfield, IL 62704", y)

    # --- Emergency Contact ---
    y += 15
    page.insert_text((50, y), "EMERGENCY CONTACT", fontsize=12, fontname="hebo")
    y += 25

    y = field("Contact Name:", "Carlos Gonzalez", y)
    y = field("Contact Phone:", "(555) 123-4567", y)
    y = field("Relationship:", "Husband", y)

    # --- Insurance ---
    y += 15
    page.insert_text((50, y), "INSURANCE INFORMATION", fontsize=12, fontname="hebo")
    y += 25

    y = field("Insurance Provider:", "Blue Cross Blue Shield", y)
    y = field("Policy/Member ID:", "BCB-2847561-MG", y)

    # --- Medical History ---
    y += 15
    page.insert_text((50, y), "MEDICAL HISTORY", fontsize=12, fontname="hebo")
    y += 25

    y = field("Allergies:", "Penicillin, Shellfish", y)
    y = field("Current Medications:", "Lisinopril 10mg, Vitamin D", y)
    y = field("Medical Conditions:", "Hypertension, Seasonal allergies", y)

    # --- Reason for Visit ---
    y += 15
    page.insert_text((50, y), "REASON FOR VISIT", fontsize=12, fontname="hebo")
    y += 25

    page.insert_text((50, y), "Persistent headaches for the past two weeks,",
                     fontsize=11, fontname="hebi", color=(0, 0, 0.6))
    y += 18
    page.insert_text((50, y), "mostly in the morning. Some dizziness.",
                     fontsize=11, fontname="hebi", color=(0, 0, 0.6))

    # --- Footer ---
    page.draw_line((50, 730), (562, 730))
    page.insert_text((50, 745), "Patient Signature: ", fontsize=10, fontname="helv")
    page.insert_text((160, 745), "Maria Gonzalez", fontsize=12, fontname="hebi",
                    color=(0, 0, 0.6))
    page.insert_text((400, 745), "Date: 01/15/2025", fontsize=10, fontname="helv")

    doc.save(output_path)
    doc.close()
    print(f"Sample form created: {output_path}")


if __name__ == "__main__":
    create_sample_form()
