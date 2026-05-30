import os
import json
import asyncio
from browser_agent import BrowserAgentRunner

DENTIST_TASK = (
    "1. Go to google.com\n"
    "2. Search for 'best dentist in naini prayagraj'\n"
    "3. Look at the local listings (Google Maps pack) or organic search results for dentists in Naini, Prayagraj.\n"
    "4. Extract details for the top 5 dentists/clinics including:\n"
    "   - Clinic / Dentist Name\n"
    "   - Rating and total review count\n"
    "   - Address or Location details\n"
    "   - Contact phone number if available\n"
    "5. Produce a clear summary report in Markdown format listing these top dentists."
)

async def run_dentist_workflow(model_name: str, headless: bool = False):
    """Executes the specific dentist extraction workflow."""
    runner = BrowserAgentRunner(model_name=model_name)
    
    print("\n" + "="*50)
    print("RUNNING WORKFLOW: Best Dentist in Naini, Prayagraj")
    print("="*50)
    
    history = await runner.run_task(task=DENTIST_TASK, headless=headless)
    
    # Try to extract the final result message
    final_result = "No results generated or task did not complete successfully."
    if history and history.history:
        # Get last action result or summary
        last_history = history.history[-1]
        if last_history.result:
            final_result = str(last_history.result)
            
    # Save the output to a report file
    report_path = "dentist_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Google Search Dentist Report: Naini, Prayagraj\n\n")
        f.write(f"**Model Used:** {model_name}\n\n")
        f.write("## Extracted Results\n\n")
        f.write(final_result)
        f.write("\n")
        
    print(f"\n[Workflow Complete] Results written to: {os.path.abspath(report_path)}")
    return report_path
