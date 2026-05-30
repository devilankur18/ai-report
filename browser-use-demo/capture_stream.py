import asyncio
import json
import os
from playwright.async_api import async_playwright

async def run():
    print("Connecting to your running Chrome instance on port 9222...")
    async with async_playwright() as p:
        try:
            # Connect over Chrome DevTools Protocol to your active Chrome browser
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            print("[✓] Connected successfully to Chrome!")
        except Exception as e:
            print(f"Error: Could not connect to Chrome on port 9222. {e}")
            print("\nPlease ensure you launched Chrome with:")
            print("1. Quit Chrome completely (Cmd+Q)")
            print("2. Run in Terminal: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222")
            return

        context = browser.contexts[0]
        
        # Look for an existing ChatGPT tab, or open a new one
        chatgpt_page = None
        for page in context.pages:
            if "chatgpt.com" in page.url:
                chatgpt_page = page
                print(f"Found active ChatGPT tab: {page.url}")
                break
                
        if not chatgpt_page:
            print("No active ChatGPT tab found. Opening a new tab...")
            chatgpt_page = await context.new_page()
            await chatgpt_page.goto("https://chatgpt.com/")
        
        # Bring it to front
        await chatgpt_page.bring_to_front()

        # Define response handler to catch the stream endpoint
        async def handle_response(response):
            url = response.url
            # Match ChatGPT's stream endpoints (e.g. conversation or backend-api)
            if "/conversation" in url:
                print(f"\n[DETECTED STREAM] Capturing data from: {url}")
                try:
                    # Get response body stream
                    body = await response.body()
                    raw_text = body.decode("utf-8")
                    
                    # Save raw stream chunks
                    raw_path = os.path.join(os.getcwd(), "chatgpt_raw_stream.txt")
                    with open(raw_path, "w", encoding="utf-8") as f:
                        f.write(raw_text)
                    print(f"[✓] Raw stream data saved to {raw_path}")

                    # Parse Server-Sent Events (SSE) stream
                    clean_text = ""
                    lines = raw_text.split("\n")
                    for line in lines:
                        if line.startswith("data:"):
                            data_content = line[5:].strip()
                            if data_content == "[DONE]":
                                break
                            try:
                                json_data = json.loads(data_content)
                                # Extract parts if they exist in the stream envelope
                                parts = json_data.get("message", {}).get("content", {}).get("parts", [])
                                if parts:
                                    clean_text = parts[0]
                            except json.JSONDecodeError:
                                continue

                    if clean_text:
                        clean_path = os.path.join(os.getcwd(), "extracted_response.md")
                        with open(clean_path, "w", encoding="utf-8") as f:
                            f.write(clean_text)
                        print(f"[✓] Parsed response text successfully saved to {clean_path}")
                        print("\n--- Extracted Response Sneak Peek ---")
                        print(clean_text[:500] + "...\n-------------------------------------")
                except Exception as e:
                    print(f"Error reading response body: {e}")

        # Listen to responses
        chatgpt_page.on("response", lambda r: asyncio.create_task(handle_response(r)))

        print("\nSubmitting medical prompt...")
        
        # Locate the textarea on ChatGPT and fill it
        try:
            textarea = chatgpt_page.locator('textarea[placeholder*="ChatGPT"], textarea[placeholder*="Message"], #prompt-textarea')
            await textarea.wait_for(timeout=5000)
            
            prompt = (
                "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. "
                "Who are the most reliable heart doctors in UP/Hardoi with good reviews, and what should I ask them?"
            )
            
            await textarea.fill(prompt)
            print("Prompt typed in textarea. Pressing Enter to send...")
            await textarea.press("Enter")
            
            # Keep script alive to capture stream chunks
            print("Waiting for response to stream and finish (30s)...")
            await asyncio.sleep(30)
            
        except Exception as e:
            print(f"Error interacting with ChatGPT page: {e}")
            print("Please make sure the ChatGPT screen is loaded and ready.")

if __name__ == "__main__":
    asyncio.run(run())
