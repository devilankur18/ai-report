
# Testing


## Process
Start a new subtask with prompt

```
Read the @ppt/doctor_ai_report_generator_guide_v6.md and generate a report for a doctor with follwoings details

Dr. Vishal Maurya
Speciality: Dentist
City: Prayagraj, Area: Naini
Clinic Name: Pravisha Healthcare

```

this subtasks will generate the report in reports/v6/ folder.


We can rerun this for other doctors or run it twice for same doctor to ensure report is giving same output.

## Doctors

Doctor 1:
Dr. Vishal Maurya
Speciality: Dentist
City: Prayagraj, Area: Naini
Clinic Name: Pravisha Healthcare


Doctor 2:
Dr. Nidhi Patel, city: vadodara
Speciality: Dermatologist,Aesthetic Dermatologist,Dermatosurgeon,Hair Transplant Surgeon



## Test cases


Test Cases with process Process
1. Multiple run for same doctor generate same structure and data of report.
Basically generate files 2 times and compare it so the gaps and dont stop until reports are same
- [dr_nidhi_patel_report-run-1.md](ppt/reports/v3/dr_nidhi_patel_report-run-1.md)
- [dr_nidhi_patel_report-run-2.md](ppt/reports/v3/dr_nidhi_patel_report-run-2.md)


2. Report for different doctor should have same structure.

generate report for 2 doctors. and check if reports have same structure.
Reports generated:
- [dr_nidhi_patel_report-run-1.md](ppt/reports/v3/dr_nidhi_patel_report-run-1.md)
- [dr_nidhi_patel_report-run-2.md](ppt/reports/v3/dr_nidhi_patel_report-run-2.md)
- [dr_vishal_maurya_report-run-1.md](ppt/reports/v3/dr_vishal_maurya_report-run-1.md)
- [dr_vishal_maurya_report-run-2.md](ppt/reports/v3/dr_vishal_maurya_report-run-2.md)

---