import re
import sys
import os
import glob
import argparse

# Strict V3 Schema constants
EXPECTED_STATIC_HEADINGS = [
    "# DIGICLINIC DIGITAL PRESENCE AUDIT & AI RANK REPORT",
    "## 🏆 OVERALL CONSOLIDATED AI RANK",
    "## 🔍 CROSS-CHANNEL SEARCH QUERY RANKING MATRIX",
    "## 🏥 ENRICHMENT AUDIT & GAP DETAILS",
    "### Clinic 1. Clinic Details",
    "### Doctor 2. Doctor Details",
    "### Patient Sentiment 3. Patient Sentiment",
    "## 📷 VISUAL PROOF INDEX",
    "## 💬 ACTIONABLE DYNAMIC TREATMENT PLAN (6 PILLARS)",
    "## 🛠️ TECHNICAL ARCHITECTURE COMPLIANCE"
]

EXPECTED_TABLE_COLUMNS = [
    'Search Query', 
    'Google Search', 
    'Google Maps', 
    'Practo/Justdial', 
    'YouTube', 
    'AI Apps (Predictive)'
]

EXPECTED_ENRICHMENT_CATEGORIES = [
    'Clinic Details',
    'Doctor Details',
    'Patient Sentiment'
]

def parse_structure(filepath):
    """
    Parses a markdown report file and returns its structural elements:
    - headings: list of all raw heading lines (H1, H2, H3)
    - tables: list of parsed table headers
    - categories: list of parsed enrichment category headings
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract all headings (lines starting with #, ##, or ###)
    headings = re.findall(r'^(#+\s+.*)$', content, re.MULTILINE)
    # Strip trailing spaces or formatting from headings
    headings = [h.strip() for h in headings]
    
    # Extract table headers for matrices
    tables = []
    lines = content.split('\n')
    for line in lines:
        if line.strip().startswith('|') and 'Search Query' in line:
            tables.append([cell.strip() for cell in line.split('|')[1:-1]])
            
    # Extract structural categories under Enrichment Audit
    # Matches '### <name> <number>. <category>' (e.g. ### Patient Sentiment 3. Patient Sentiment)
    categories = re.findall(r'###\s+[A-Za-z\s]+\s+\d+\.\s+([A-Za-z0-9\s&()\-]+)', content)
    categories = [cat.strip() for cat in categories]
    
    return {
        "headings": headings,
        "tables": tables,
        "categories": categories
    }

def verify_report_compliance(filepath):
    """
    Verifies that a report conforms to the strict V3 schema rules.
    Raises ValueError on compliance failure.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Report file not found: {filepath}")
        
    struct = parse_structure(filepath)
    
    # 1. Heading count check
    if len(struct['headings']) != 11:
        raise ValueError(
            f"Expected exactly 11 headings, but found {len(struct['headings'])}.\n"
            f"Headings parsed: {struct['headings']}"
        )
        
    # 2. Static heading parity check (excluding dynamic scorecard heading at index 2)
    headings_static = struct['headings'][:2] + struct['headings'][3:]
    for i, (actual, expected) in enumerate(zip(headings_static, EXPECTED_STATIC_HEADINGS)):
        if actual != expected:
            raise ValueError(
                f"Heading mismatch at static index {i}.\n"
                f"Expected: '{expected}'\n"
                f"Actual:   '{actual}'"
            )
            
    # 3. Table Column schema verification
    if not struct['tables']:
        raise ValueError("No Search Query matrix table header found in report.")
        
    actual_columns = struct['tables'][0]
    if actual_columns != EXPECTED_TABLE_COLUMNS:
        raise ValueError(
            f"Search Query matrix table column mismatch.\n"
            f"Expected: {EXPECTED_TABLE_COLUMNS}\n"
            f"Actual:   {actual_columns}"
        )
        
    # 4. Enrichment Audit categories check
    if struct['categories'] != EXPECTED_ENRICHMENT_CATEGORIES:
        raise ValueError(
            f"Enrichment audit categories mismatch under Section 4.\n"
            f"Expected: {EXPECTED_ENRICHMENT_CATEGORIES}\n"
            f"Actual:   {struct['categories']}"
        )
        
    return struct

def verify_parity_between(file_list):
    """
    Verifies structural identicality and parity across a list of reports.
    Assumes each file has already been checked for single-file compliance.
    """
    if len(file_list) < 2:
        return True
        
    first_file = file_list[0]
    first_struct = parse_structure(first_file)
    first_headings_static = first_struct['headings'][:2] + first_struct['headings'][3:]
    
    for other_file in file_list[1:]:
        other_struct = parse_structure(other_file)
        other_headings_static = other_struct['headings'][:2] + other_struct['headings'][3:]
        
        # Heading parity check
        if first_headings_static != other_headings_static:
            raise ValueError(
                f"Heading structure parity failure between:\n"
                f"  - {first_file}\n"
                f"  - {other_file}\n"
                f"Ensure H2 and H3 static headings match character-for-character."
            )
            
        # Table parity check
        if first_struct['tables'] != other_struct['tables']:
            raise ValueError(
                f"Table schema column parity failure between:\n"
                f"  - {first_file}\n"
                f"  - {other_file}"
            )
            
        # Enrichment categories parity check
        if first_struct['categories'] != other_struct['categories']:
            raise ValueError(
                f"Enrichment categories parity failure between:\n"
                f"  - {first_file}\n"
                f"  - {other_file}"
            )
            
    return True

def check_file_content_identity(file1, file2):
    """
    Asserts that two files are 100% identical in character content (determinism verification).
    """
    with open(file1, 'r', encoding='utf-8') as f1, open(file2, 'r', encoding='utf-8') as f2:
        c1 = f1.read()
        c2 = f2.read()
    return c1 == c2

def run_dynamic_scanner(reports_dir):
    """
    Dynamically scans the given directory, groups files by doctor,
    verifies determinism (identity check on runs), compliance, and parity.
    """
    # Look for files matching 'dr_*_report-run-*.md'
    pattern = os.path.join(reports_dir, "dr_*_report-run-*.md")
    report_files = glob.glob(pattern)
    
    if not report_files:
        print(f"⚠️  No doctor report files matching pattern 'dr_*_report-run-*.md' found in '{reports_dir}'.")
        return
        
    print(f"🔍 Discovered {len(report_files)} report run files inside '{reports_dir}'.")
    
    # Group by doctor slug
    # File name structure: dr_nidhi_patel_report-run-1.md -> slug is dr_nidhi_patel
    doctor_groups = {}
    for filepath in report_files:
        filename = os.path.basename(filepath)
        match = re.match(r'(dr_[a-z_]+)_report-run-\d+\.md', filename)
        if match:
            slug = match.group(1)
            doctor_groups.setdefault(slug, []).append(filepath)
            
    print(f"👥 Identified {len(doctor_groups)} unique doctors: {', '.join(doctor_groups.keys())}\n")
    
    all_reports = []
    
    # Verify determinism and compliance for each doctor group
    for slug, paths in doctor_groups.items():
        print(f"🧑‍⚕️  Processing Doctor: {slug} ({len(paths)} runs found)")
        paths.sort() # sort so run-1 is before run-2
        
        # 1. Determinism/Identity verification
        if len(paths) >= 2:
            print("  ↳ ⚖️  Verifying run determinism (identical file contents)...")
            # Compare every run file content to the first run
            first_run = paths[0]
            for subsequent_run in paths[1:]:
                if check_file_content_identity(first_run, subsequent_run):
                    print(f"    🟢 PASS: {os.path.basename(first_run)} ⟷ {os.path.basename(subsequent_run)} are 100% identical.")
                else:
                    print(f"    ❌ FAIL: {os.path.basename(first_run)} and {os.path.basename(subsequent_run)} differ in content.")
                    sys.exit(1)
        else:
            print("  ↳ ℹ️  Only 1 run file found. Determinism diff check skipped.")
            
        # 2. Single-file compliance verification
        for path in paths:
            filename = os.path.basename(path)
            try:
                verify_report_compliance(path)
                print(f"    🟢 PASS: Schema compliance verification for {filename}")
                all_reports.append(path)
            except Exception as e:
                print(f"    ❌ FAIL: Schema compliance verification for {filename}")
                print(f"      ↳ Error details: {e}")
                sys.exit(1)
                
        print()
        
    # 3. Structural parity validation between all different doctors
    if len(doctor_groups) >= 2:
        print("🌐 Verifying cross-doctor structural parity...")
        representative_reports = [paths[0] for paths in doctor_groups.values()]
        try:
            verify_parity_between(representative_reports)
            print("  🟢 SUCCESS: All different doctor reports share 100% identical static heading hierarchies, table structures, and category fields!")
        except Exception as e:
            print("  ❌ FAIL: Cross-doctor structural parity mismatch.")
            print(f"    ↳ Error details: {e}")
            sys.exit(1)
    else:
        print("🌐 Single doctor files indexed. Cross-doctor parity skipped.")
        
    print("\n🎉 ALL TESTS PASSED: Reports conform to the EXACT same v3 operational schema! 🎉")

def main():
    parser = argparse.ArgumentParser(
        description="DigiClinic Digital Presence Report Structural Verification Tool (V3 Schema)"
    )
    parser.add_argument(
        "files", 
        nargs="*", 
        help="Specific markdown file path(s) to verify. If empty, runs the dynamic directory scanner."
    )
    parser.add_argument(
        "--dir", 
        default="reports/v3", 
        help="Directory to scan when run in dynamic mode (default: reports/v3)"
    )
    
    args = parser.parse_args()
    
    if args.files:
        print(f"🔍 Compliance checking {len(args.files)} specified file(s)...")
        # 1. Single-file compliance check
        for file in args.files:
            try:
                verify_report_compliance(file)
                print(f"🟢 PASS: Compliance verification for '{file}'")
            except Exception as e:
                print(f"❌ FAIL: Compliance verification for '{file}'")
                print(f"  ↳ Error: {e}")
                sys.exit(1)
                
        # 2. Structural parity comparison if multiple files
        if len(args.files) >= 2:
            print("\n🔍 Checking structural parity across specified files...")
            try:
                verify_parity_between(args.files)
                print("🟢 PASS: All specified reports have 100% static structural parity!")
            except Exception as e:
                print("❌ FAIL: Structural parity mismatch across specified files.")
                print(f"  ↳ Error: {e}")
                sys.exit(1)
                
        print("\n🎉 PARITY CHECK COMPLETE: Complies with operational specifications! 🎉")
    else:
        # Run dynamic scanner
        run_dynamic_scanner(args.dir)

if __name__ == "__main__":
    main()
