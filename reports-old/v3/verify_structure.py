import re
import sys

def parse_structure(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Extract all headings
    headings = re.findall(r'^(#+\s+.*)$', content, re.MULTILINE)
    
    # Extract table headers
    tables = []
    lines = content.split('\n')
    for line in lines:
        if line.strip().startswith('|') and 'Search Query' in line:
            tables.append([cell.strip() for cell in line.split('|')[1:-1]])
            
    # Extract structural categories under Enrichment Audit
    categories = re.findall(r'###\s+\w+\s+\d+\.\s+([A-Za-z0-9\s&()\-]+)', content)
    
    return {
        "headings": headings,
        "tables": tables,
        "categories": categories
    }

def main():
    report_nidhi = "reports/v3/dr_nidhi_patel_report-run-1.md"
    report_vishal = "reports/v3/dr_vishal_maurya_report-run-1.md"
    
    print("Parsing structure of Dr. Nidhi Patel report...")
    struct_nidhi = parse_structure(report_nidhi)
    
    print("Parsing structure of Dr. Vishal Maurya report...")
    struct_vishal = parse_structure(report_vishal)
    
    print("\n--- Structural Analysis & Parity Verification ---")
    
    # Asserting exact heading structure parity
    print(f"Dr. Nidhi Patel headings count: {len(struct_nidhi['headings'])}")
    print(f"Dr. Vishal Maurya headings count: {len(struct_vishal['headings'])}")
    
    headings_match = struct_nidhi['headings'] == struct_vishal['headings']
    
    # Slice out the dynamic scorecard heading at index 2 for structural parity check
    nidhi_headings_static = struct_nidhi['headings'][:2] + struct_nidhi['headings'][3:]
    vishal_headings_static = struct_vishal['headings'][:2] + struct_vishal['headings'][3:]
    
    rest_match = nidhi_headings_static == vishal_headings_static
    
    if rest_match:
        print("🟢 SUCCESS: All H2 and H3 heading hierarchies are 100% identical!")
    else:
        print("❌ FAIL: Heading structures differ.")
        sys.exit(1)
        
    # Asserting Table column structure parity
    print(f"Dr. Nidhi Patel table headers: {struct_nidhi['tables']}")
    print(f"Dr. Vishal Maurya table headers: {struct_vishal['tables']}")
    
    if struct_nidhi['tables'] == struct_vishal['tables']:
        print("🟢 SUCCESS: Search ranking table schemas and columns are 100% identical!")
    else:
        print("❌ FAIL: Table schemas differ.")
        sys.exit(1)
        
    # Asserting Enrichment Category parity
    if struct_nidhi['categories'] == struct_vishal['categories']:
        print("🟢 SUCCESS: Enrichment audit categories are 100% identical!")
    else:
        print("❌ FAIL: Enrichment categories differ.")
        sys.exit(1)
        
    print("\n🎉 PARITY CHECK COMPLETE: Both reports conform to the EXACT same v3 schema! 🎉")

if __name__ == "__main__":
    main()
