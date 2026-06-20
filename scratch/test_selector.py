from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/proposals/new?type=wizard")
        page.wait_for_timeout(10000) # Wait 10 seconds for hydration and DB fetch
        
        buttons = page.locator("button").all()
        print(f"Total buttons found: {len(buttons)}")
        
        for idx, btn in enumerate(buttons):
            text = btn.inner_text()
            html = btn.evaluate("el => el.outerHTML")
            print(f"Button {idx}: text='{text}'")
            print(f"HTML: {html[:200]}\n")
                
        browser.close()

if __name__ == "__main__":
    run()
