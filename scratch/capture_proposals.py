from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        # Set the bypass_auth cookie
        context.add_cookies([
            {
                "name": "bypass_auth",
                "value": "true",
                "domain": "localhost",
                "path": "/"
            }
        ])
        page = context.new_page()
        page.goto("http://localhost:3000/proposals/new?type=wizard")
        page.wait_for_timeout(5000)
        
        # Take a screenshot to see what's loaded
        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/scratch_wizard.png", full_page=True)
        print("Screenshot saved to tests/screenshots/scratch_wizard.png")
        
        # Print inner text of the body to see if we're on the wizard or login page
        body_text = page.locator("body").inner_text()
        print("Is on login page:", "Sign In" in body_text and "Forgot Password" in body_text)
        print("Is on wizard page:", "Start from a Business Template" in body_text or "Quick-Add Typical Lagos Loads" in body_text)
        
        # Print list of buttons
        buttons = page.locator("button").all()
        print(f"Total buttons found on page: {len(buttons)}")
        for idx, btn in enumerate(buttons):
            print(f"Button {idx}: text='{btn.inner_text()}'")
            
        browser.close()

if __name__ == "__main__":
    run()
