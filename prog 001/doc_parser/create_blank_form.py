"""
Creates a blank medical intake form PDF — print it out and fill it in by hand!
"""

import fitz

def create_blank_form(output_path="blank_intake_form.pdf"):
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # Letter size

    # --- Header ---
    page.insert_text((180, 40), "PATIENT INTAKE FORM", fontsize=18, fontname="helv")
    page.insert_text((190, 60), "Springfield Medical Clinic", fontsize=11, fontname="helv")
    page.draw_line((50, 70), (562, 70))

    y = 100

    def field(label, y_pos, line_width=330):
        """Draw a label with a blank line to fill in."""
        page.insert_text((50, y_pos), label, fontsize=10, fontname="helv")
        line_start = 50 + len(label) * 5.5 + 10
        page.draw_line((line_start, y_pos + 3), (line_start + line_width, y_pos + 3),
                       color=(0.6, 0.6, 0.6), width=0.5)
        return y_pos + 28

    def section(title, y_pos):
        """Draw a section header."""
        y_pos += 10
        page.insert_text((50, y_pos), title, fontsize=12, fontname="hebo")
        return y_pos + 22

    # --- Patient Information ---
    y = section("PATIENT INFORMATION", y)
    y = field("First Name:", y)
    y = field("Last Name:", y)
    y = field("Date of Birth:", y)
    y = field("Gender:", y)
    y = field("Phone Number:", y)
    y = field("Email:", y)
    y = field("Address:", y)

    # --- Emergency Contact ---
    y = section("EMERGENCY CONTACT", y)
    y = field("Contact Name:", y)
    y = field("Contact Phone:", y)
    y = field("Relationship:", y)

    # --- Insurance ---
    y = section("INSURANCE INFORMATION", y)
    y = field("Insurance Provider:", y)
    y = field("Policy / Member ID:", y)

    # --- Medical History ---
    y = section("MEDICAL HISTORY", y)
    y = field("Allergies:", y)
    y = field("Current Medications:", y)
    y = field("Medical Conditions:", y)

    # --- Reason for Visit ---
    y = section("REASON FOR VISIT", y)
    # Draw a box for free-form writing
    box_top = y
    box_height = 80
    page.draw_rect(fitz.Rect(50, box_top, 562, box_top + box_height),
                   color=(0.6, 0.6, 0.6), width=0.5)
    # Light horizontal guide lines inside the box
    for line_y in range(box_top + 20, box_top + box_height, 20):
        page.draw_line((55, line_y), (557, line_y),
                       color=(0.85, 0.85, 0.85), width=0.3)
    y = box_top + box_height + 15

    # --- Signature ---
    page.draw_line((50, 730), (562, 730))
    page.insert_text((50, 748), "Patient Signature:", fontsize=10, fontname="helv")
    page.draw_line((160, 750), (380, 750), color=(0.6, 0.6, 0.6), width=0.5)
    page.insert_text((400, 748), "Date:", fontsize=10, fontname="helv")
    page.draw_line((435, 750), (562, 750), color=(0.6, 0.6, 0.6), width=0.5)

    doc.save(output_path)
    doc.close()
    print(f"Blank form created: {output_path}")
    print("Print it out, fill it in by hand, then scan/photo it!")


if __name__ == "__main__":
    create_blank_form()
