
Doctor 1:
Dr. Vishal Maurya
Speciality: Dentist
City: Prayagraj, Area: Naini
Clinic Name: Pravisha Healthcare


Doctor 2:
Dr. Nidhi Patel, city: vadodara
Speciality: Dermatologist,Aesthetic Dermatologist,Dermatosurgeon,Hair Transplant Surgeon






Test Cases with process Process
1. Multiple run for same doctor generate same structure and data of report.
Basically generate files 2 times and compare it so the gaps and dont stop until reports are same
- [dr_nidhi_patel_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-1.md)
- [dr_nidhi_patel_report-run-2.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-2.md)


2. Report for different doctor should have same structure.

generate report for 2 doctors. and check if reports have same structure.
Reports generated:
- [dr_nidhi_patel_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-1.md)
- [dr_nidhi_patel_report-run-2.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-2.md)
- [dr_vishal_maurya_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_vishal_maurya_report-run-1.md)
- [dr_vishal_maurya_report-run-2.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_vishal_maurya_report-run-2.md)

---

## ✅ VERIFICATION & TEST RESULTS (PASSED)

### Test Case 1: Multiple runs for the same doctor yield identical reports
*   **Action:** Generated reports for Dr. Nidhi Patel and Dr. Vishal Maurya twice:
    *   Dr. Patel: [dr_nidhi_patel_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-1.md) & [dr_nidhi_patel_report-run-2.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-2.md)
    *   Dr. Maurya: [dr_vishal_maurya_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_vishal_maurya_report-run-1.md) & [dr_vishal_maurya_report-run-2.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_vishal_maurya_report-run-2.md)
*   **Verification:** Ran command `diff reports/v3/dr_nidhi_patel_report-run-1.md reports/v3/dr_nidhi_patel_report-run-2.md` and `diff reports/v3/dr_vishal_maurya_report-run-1.md reports/v3/dr_vishal_maurya_report-run-2.md`.
*   **Result:** `diff` output for both comparisons was completely empty. Reports are 100% identical and deterministic.

### Test Case 2: Reports for different doctors share the identical schema/structure
*   **Action:** Checked structural similarity between Dr. Nidhi Patel and Dr. Vishal Maurya reports:
    *   [dr_nidhi_patel_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_nidhi_patel_report-run-1.md)
    *   [dr_vishal_maurya_report-run-1.md](file:///Users/ankur/dev/docx/ppt/reports/v3/dr_vishal_maurya_report-run-1.md)
*   **Verification:** Ran custom programmatic parser [verify_structure.py](file:///Users/ankur/dev/docx/ppt/reports/v3/verify_structure.py).
*   **Result:**
    ```
    Parsing structure of Dr. Nidhi Patel report...
    Parsing structure of Dr. Vishal Maurya report...

    --- Structural Analysis & Parity Verification ---
    Dr. Nidhi Patel headings count: 12
    Dr. Vishal Maurya headings count: 12
    🟢 SUCCESS: All H2 and H3 heading hierarchies are 100% identical!
    Dr. Nidhi Patel table headers: [['Search Query', 'Google Search', 'Google Maps', 'Practo/Justdial', 'YouTube', 'AI Apps (Predictive)']]
    Dr. Vishal Maurya table headers: [['Search Query', 'Google Search', 'Google Maps', 'Practo/Justdial', 'YouTube', 'AI Apps (Predictive)']]
    🟢 SUCCESS: Search ranking table schemas and columns are 100% identical!
    🟢 SUCCESS: Enrichment audit categories are 100% identical!

    🎉 PARITY CHECK COMPLETE: Both reports conform to the EXACT same v3 schema! 🎉
    ```