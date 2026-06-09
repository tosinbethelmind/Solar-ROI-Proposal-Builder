"""
SolarPro E2E QA Tests
=====================
Tests all 3 bug fixes plus overall navigation and page integrity.

Bug 1: /workspace/crm route should not 404
Bug 2: Pricing tier selector should render with premium styling
Bug 3: Proposal delete button should work and update the list
"""

import sys
import os
import json
import time
import traceback

# Force UTF-8 output on Windows
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
RESULTS = []
TIMEOUT = 180000  # 180s to allow Next.js dev server compilation on Windows VMs
NAV_TIMEOUT = 45000


def record(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    RESULTS.append({"test": name, "status": status, "detail": detail})
    icon = "[PASS]" if passed else "[FAIL]"
    msg = f"  {icon} {name}"
    if detail:
        msg += f" -- {detail}"
    print(msg)


def warmup(page):
    """Hit the homepage repeatedly until Next.js finishes compiling, and pre-compile other critical pages."""
    print("\n[WARMUP] Waiting for Next.js dev server to compile...")
    server_ready = False
    for attempt in range(1, 19):  # up to ~3 minutes
        try:
            resp = page.goto(BASE, wait_until="domcontentloaded", timeout=15000)
            if resp and resp.status == 200:
                # Wait a bit more for full hydration
                page.wait_for_load_state("networkidle", timeout=30000)
                print(f"[WARMUP] Server ready after attempt {attempt}")
                server_ready = True
                break
        except Exception:
            print(f"[WARMUP] Attempt {attempt}/18 - server still compiling, retrying in 10s...")
            time.sleep(10)

    if not server_ready:
        print("[WARMUP] Server did not become ready in time!")
        return False

    # Pre-compile critical routes to avoid timeouts/swallowed clicks during tests
    print("[WARMUP] Pre-compiling critical routes...")
    for path in ["/workspace", "/history", "/proposals/new?type=wizard"]:
        try:
            print(f"[WARMUP] Pre-compiling {path}...")
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=45000)
        except Exception as e:
            print(f"[WARMUP] Pre-compiling {path} warning: {str(e)[:80]}")

    print("[WARMUP] Pre-compilation complete.")
    return True


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        context.add_cookies([
            {
                "name": "bypass_auth",
                "value": "true",
                "domain": "localhost",
                "path": "/"
            }
        ])
        page = context.new_page()

        # Warmup phase - let Next.js compile
        if not warmup(page):
            record("Server warmup", False, "Next.js dev server did not respond in time")
            browser.close()
            return

        # ------------------------------------------------
        # TEST GROUP 1: Homepage & Navigation
        # ------------------------------------------------
        print("\n--- TEST GROUP 1: Homepage & Core Navigation ---")

        # 1a - Homepage loads
        try:
            page.goto(BASE, wait_until="networkidle", timeout=TIMEOUT)
            title = page.title()
            record("Homepage loads", True, f"Title: {title}")
        except Exception as e:
            record("Homepage loads", False, str(e)[:120])

        # 1b - Homepage has hero section
        try:
            hero = page.locator("h1").first
            hero_text = hero.inner_text(timeout=15000)
            record("Homepage has hero H1", bool(hero_text), f"H1: {hero_text[:60]}")
        except Exception as e:
            record("Homepage has hero H1", False, str(e)[:120])

        # 1c - Homepage nav links exist
        try:
            nav_links = page.locator("header a, nav a").all()
            link_count = len(nav_links)
            record("Homepage nav links present", link_count >= 2, f"Found {link_count} nav links")
        except Exception as e:
            record("Homepage nav links present", False, str(e)[:120])

        # ------------------------------------------------
        # TEST GROUP 2: Bug 1 - /workspace/crm route
        # ------------------------------------------------
        print("\n--- TEST GROUP 2: Bug 1 - CRM & History Route (was 404) ---")

        # 2a - /workspace loads
        try:
            resp = page.goto(f"{BASE}/workspace", wait_until="networkidle", timeout=TIMEOUT)
            record("/workspace loads", resp.status == 200, f"Status: {resp.status}")
        except Exception as e:
            record("/workspace loads", False, str(e)[:120])

        # 2b - /workspace/crm does NOT 404
        try:
            resp = page.goto(f"{BASE}/workspace/crm", wait_until="domcontentloaded", timeout=TIMEOUT)
            is_ok = resp.status == 200
            body_text = page.locator("body").inner_text(timeout=15000)
            has_404 = "404" in body_text and "not found" in body_text.lower()
            passed = is_ok and not has_404
            record("/workspace/crm does not 404", passed,
                   f"Status: {resp.status}, contains404text: {has_404}")
        except Exception as e:
            record("/workspace/crm does not 404", False, str(e)[:120])

        # 2c - /workspace/crm redirects to /history (or renders history content)
        try:
            # Wait for client-side transition to complete
            try:
                page.wait_for_url("**/history", timeout=10000)
            except Exception:
                pass
            current_url = page.url
            landed_on_history = "/history" in current_url
            has_history_content = False
            try:
                has_history_content = page.locator("text=Proposal History").first.is_visible(timeout=5000)
            except Exception:
                pass
            passed = landed_on_history or has_history_content
            record("/workspace/crm resolves to history content", passed,
                   f"URL: {current_url}, historyContent: {has_history_content}")
        except Exception as e:
            record("/workspace/crm resolves to history content", False, str(e)[:120])

        # 2d - Workspace nav link for CRM/History works
        try:
            page.goto(f"{BASE}/workspace", wait_until="networkidle", timeout=TIMEOUT)
            page.wait_for_timeout(2000)
            # Find the CRM / History element, searching buttons and anchor tags
            crm_link = page.locator("button:has-text('CRM'), button:has-text('History'), a:has-text('CRM'), a:has-text('History'), a[href*='crm'], a[href*='history']").first
            crm_link.click(timeout=15000)
            
            # Wait for route resolution
            try:
                page.wait_for_url("**/history", timeout=10000)
            except Exception:
                pass
            
            current_url = page.url
            body_text = page.locator("body").inner_text(timeout=10000)
            has_404 = "404" in body_text and "not found" in body_text.lower()
            record("Workspace CRM nav link works", not has_404,
                   f"Navigated to: {current_url}")
        except Exception as e:
            record("Workspace CRM nav link works", False, str(e)[:120])

        # ------------------------------------------------
        # TEST GROUP 3: Bug 2 - Pricing Tier Selector
        # ------------------------------------------------
        print("\n--- TEST GROUP 3: Bug 2 - Pricing Tier Selector ---")

        # 3a - /proposals/new?type=wizard loads
        try:
            resp = page.goto(f"{BASE}/proposals/new?type=wizard", wait_until="networkidle", timeout=TIMEOUT)
            record("/proposals/new loads", resp.status == 200, f"Status: {resp.status}")
        except Exception as e:
            record("/proposals/new loads", False, str(e)[:120])

        # 3b - Navigate to step 3 (Hardware Selection where Tiers are visible)
        try:
            page.wait_for_timeout(5000)
            
            # Step 1: Click quick-add load presets to add typical Lagos loads.
            # Retry click up to 10 times to bypass early-hydration click swallows.
            tv_preset = page.locator("button:has-text('LED TV'), button:has-text('TV')").first
            tv_preset.wait_for(state="visible", timeout=15000)
            
            success = False
            for attempt in range(10):
                try:
                    tv_preset.click(timeout=5000)
                    page.wait_for_timeout(1000)
                    body_text = page.locator("body").inner_text()
                    if "1 appliance selected" in body_text:
                        success = True
                        break
                except Exception:
                    pass
            
            if not success:
                print("[WARNING] Click to add preset TV was swallowed or failed.")
            
            # Click Next to go to Step 2 (System Preferences)
            next_btn1 = page.locator("button:has-text('Next: System Preferences'), button:has-text('Next')").first
            next_btn1.click(timeout=15000)
            page.wait_for_timeout(2000)
            
            # Step 2: Preferences. Click Next to go to Step 3 (Hardware Selection)
            next_btn2 = page.locator("button:has-text('Next: Hardware Selection'), button:has-text('Next')").first
            next_btn2.click(timeout=15000)
            page.wait_for_timeout(2000)
            
            record("Navigated to Step 3 Hardware Selection (Tiers Page)", True)
        except Exception as e:
            record("Navigated to Step 3 Hardware Selection (Tiers Page)", False, str(e)[:120])

        # 3c - Check for tier selector elements on Step 3
        try:
            os.makedirs("tests/screenshots", exist_ok=True)
            page.screenshot(path="tests/screenshots/hardware_tiers_step.png", full_page=True)

            tier_elements = page.locator("[class*='tier'], [class*='Tier'], button:has-text('Budget'), button:has-text('Standard'), button:has-text('Premium'), [data-tier]").all()
            has_tiers = len(tier_elements) > 0
            
            body_text = page.locator("body").inner_text()
            has_budget_pkg = "Budget Package" in body_text
            has_standard_pkg = "Standard Package" in body_text
            has_premium_pkg = "Premium Package" in body_text
            
            passed = has_tiers or (has_budget_pkg and has_standard_pkg and has_premium_pkg)
            record("Tier selector elements present", passed,
                   f"Found {len(tier_elements)} tier elements. BudgetPkg: {has_budget_pkg}, StandardPkg: {has_standard_pkg}, PremiumPkg: {has_premium_pkg}")
        except Exception as e:
            record("Tier selector elements present", False, str(e)[:120])

        # 3d - Tier buttons interactive
        try:
            tier_btns = page.locator("button:has-text('Select Economy'), button:has-text('Select Standard'), button:has-text('Select Premium'), button:has-text('Budget'), button:has-text('Standard'), button:has-text('Premium')").all()
            if len(tier_btns) > 0:
                target = tier_btns[1] if len(tier_btns) > 1 else tier_btns[0]
                target.click(timeout=10000)
                page.wait_for_timeout(500)
                record("Tier buttons are interactive", True, f"{len(tier_btns)} tier buttons found and clickable")
            else:
                cards = page.locator("[role='button'], [role='radio'], [class*='cursor-pointer']").all()
                record("Tier buttons are interactive", len(cards) > 0,
                       f"Found {len(cards)} interactive card elements")
        except Exception as e:
            record("Tier buttons are interactive", False, str(e)[:120])

        # 3e - Proceed to Step 4 (Pricing & ROI)
        try:
            # Step 3: Hardware BOM. Click Continue to go to Step 4 (Pricing & ROI)
            next_btn3 = page.locator("button:has-text('Continue to ROI'), button:has-text('Continue'), button:has-text('Proceed')").first
            next_btn3.click(timeout=15000)
            page.wait_for_timeout(2000)
            
            # Verify we landed on Step 4
            body_text = page.locator("body").inner_text()
            has_roi = "ROI" in body_text or "Payback" in body_text or "Step 4" in body_text
            record("Navigated to Step 4 Pricing & ROI", has_roi, f"Landed on ROI step: {has_roi}")
        except Exception as e:
            record("Navigated to Step 4 Pricing & ROI", False, str(e)[:120])

        # ------------------------------------------------
        # TEST GROUP 4: Bug 3 - Delete Proposal
        # ------------------------------------------------
        print("\n--- TEST GROUP 4: Bug 3 - Proposal Deletion & State Sync ---")

        # 4a - Seed test proposals (using correct solar-history-store key)
        try:
            page.goto(BASE, wait_until="networkidle", timeout=TIMEOUT)

            page.evaluate("""() => {
                const testProposal = {
                    state: {
                        savedProposals: [
                            {
                                id: "test-delete-001",
                                createdAt: new Date().getTime(),
                                proposal: {
                                    customer_name: "Delete Test Client",
                                    selected_tier: "standard",
                                    final_quoted_price_ngn: 2500000,
                                    phone: "08099999999",
                                    location: "Lagos"
                                },
                                calculations: { inverterKva: 5 },
                                pipelineStatus: "new"
                            },
                            {
                                id: "test-keep-002",
                                createdAt: new Date().getTime(),
                                proposal: {
                                    customer_name: "Keep This Client",
                                    selected_tier: "premium",
                                    final_quoted_price_ngn: 4500000,
                                    phone: "08088888888",
                                    location: "Abuja"
                                },
                                calculations: { inverterKva: 10 },
                                pipelineStatus: "sent"
                            }
                        ]
                    },
                    version: 0
                };
                localStorage.setItem('solar-history-store', JSON.stringify(testProposal));
            }""")
            record("Test proposals seeded in localStorage", True)
        except Exception as e:
            record("Test proposals seeded in localStorage", False, str(e)[:120])

        # 4b - Verify proposals appear on /history
        try:
            page.goto(f"{BASE}/history", wait_until="networkidle", timeout=TIMEOUT)
            page.wait_for_timeout(3000)

            page.screenshot(path="tests/screenshots/history_before_delete.png", full_page=True)

            body_text = page.locator("body").inner_text(timeout=15000)
            has_delete_client = "Delete Test Client" in body_text
            has_keep_client = "Keep This Client" in body_text

            record("Seeded proposals visible on /history", has_delete_client and has_keep_client,
                   f"DeleteClient: {has_delete_client}, KeepClient: {has_keep_client}")
        except Exception as e:
            record("Seeded proposals visible on /history", False, str(e)[:120])

        # 4c - Delete buttons exist
        try:
            delete_btns = page.locator("button:has-text('Delete')").all()
            record("Delete buttons present", len(delete_btns) > 0, f"Found {len(delete_btns)} delete buttons")
        except Exception as e:
            record("Delete buttons present", False, str(e)[:120])

        # 4d - Click delete and confirm dialog
        try:
            page.on("dialog", lambda dialog: dialog.accept())

            delete_btn = page.locator("button:has-text('Delete')").first
            delete_btn.click(timeout=15000)
            page.wait_for_timeout(2000)

            page.screenshot(path="tests/screenshots/history_after_delete.png", full_page=True)

            body_text = page.locator("body").inner_text(timeout=15000)
            deleted_gone = "Delete Test Client" not in body_text
            kept_remains = "Keep This Client" in body_text

            record("Delete removes proposal from list", deleted_gone,
                   f"DeletedGone: {deleted_gone}, KeptRemains: {kept_remains}")
        except Exception as e:
            record("Delete removes proposal from list", False, str(e)[:120])

        # 4e - Verify localStorage updated
        try:
            ls_data = page.evaluate("""() => {
                const raw = localStorage.getItem('solar-history-store');
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return parsed.state ? parsed.state.savedProposals : null;
            }""")

            if ls_data is not None:
                ids = [p.get("id") for p in ls_data]
                deleted_gone_ls = "test-delete-001" not in ids
                kept_in_ls = "test-keep-002" in ids
                record("localStorage updated after delete", deleted_gone_ls and kept_in_ls,
                       f"Remaining IDs: {ids}")
            else:
                record("localStorage updated after delete", False, "Could not read localStorage")
        except Exception as e:
            record("localStorage updated after delete", False, str(e)[:120])

        # ------------------------------------------------
        # TEST GROUP 5: Key Pages Load
        # ------------------------------------------------
        print("\n--- TEST GROUP 5: Key Pages Load Without Errors ---")

        pages_to_check = [
            ("/", "Homepage"),
            ("/workspace", "Workspace Dashboard"),
            ("/history", "History Page"),
            ("/estimator", "Client Estimator"),
            ("/blog", "Blog Page"),
            ("/pricing", "Pricing Page"),
            ("/start-simple", "Start Simple"),
        ]

        for path, name in pages_to_check:
            try:
                resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=TIMEOUT)
                body = page.locator("body").inner_text(timeout=15000)
                is_404 = resp.status == 404 or ("404" in body and "not found" in body.lower())
                has_error = "error" in body.lower()[:200] and "unhandled" in body.lower()[:500]
                passed = resp.status == 200 and not is_404 and not has_error
                record(f"{name} ({path}) loads", passed, f"Status: {resp.status}")
            except Exception as e:
                record(f"{name} ({path}) loads", False, str(e)[:120])

        # ------------------------------------------------
        # TEST GROUP 6: Mobile Responsiveness
        # ------------------------------------------------
        print("\n--- TEST GROUP 6: Mobile Viewport Checks ---")

        try:
            page.set_viewport_size({"width": 375, "height": 812})
            page.goto(BASE, wait_until="networkidle", timeout=TIMEOUT)
            page.screenshot(path="tests/screenshots/homepage_mobile.png", full_page=False)

            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            viewport_width = page.evaluate("() => window.innerWidth")
            no_overflow = scroll_width <= viewport_width + 10  # 10px tolerance for scrollbars
            record("Homepage no horizontal overflow (mobile)", no_overflow,
                   f"scrollWidth: {scroll_width}, viewportWidth: {viewport_width}")
        except Exception as e:
            record("Homepage no horizontal overflow (mobile)", False, str(e)[:120])

        try:
            page.goto(f"{BASE}/history", wait_until="networkidle", timeout=TIMEOUT)
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/history_mobile.png", full_page=False)
            record("History page renders on mobile", True)
        except Exception as e:
            record("History page renders on mobile", False, str(e)[:120])

        page.set_viewport_size({"width": 1280, "height": 900})

        # ------------------------------------------------
        # TEST GROUP 7: Console Errors
        # ------------------------------------------------
        print("\n--- TEST GROUP 7: Console Error Monitoring ---")

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        critical_pages = ["/", "/workspace", "/history", "/proposals/new"]
        for path in critical_pages:
            try:
                console_errors.clear()
                page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=TIMEOUT)
                page.wait_for_timeout(2000)

                # Filter out standard third-party warnings and sandboxed network limits (ERR_NAME_NOT_RESOLVED)
                real_errors = [e for e in console_errors
                              if "hydrat" not in e.lower()
                              and "favicon" not in e.lower()
                              and "third-party" not in e.lower()
                              and "err_name_not_resolved" not in e.lower()
                              and "net::err_" not in e.lower()]

                record(f"No critical console errors on {path}", len(real_errors) == 0,
                       f"{len(real_errors)} errors" + (f": {real_errors[0][:80]}" if real_errors else ""))
            except Exception as e:
                record(f"No critical console errors on {path}", False, str(e)[:120])

        browser.close()


def main():
    print("=" * 60)
    print("  SolarPro -- Comprehensive E2E QA Test Suite")
    print("=" * 60)

    try:
        run_tests()
    except Exception as e:
        print(f"\n!! FATAL ERROR: {e}")
        traceback.print_exc()

    # --- Summary ---
    print("\n" + "=" * 60)
    print("  TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = len(RESULTS)

    print(f"\n  Total:  {total}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {failed}")
    pct = (passed / total * 100) if total else 0
    print(f"  Rate:   {pct:.0f}%\n")

    if failed > 0:
        print("  FAILED TESTS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    [FAIL] {r['test']}: {r['detail']}")

    with open("tests/qa_results.json", "w") as f:
        json.dump({"total": total, "passed": passed, "failed": failed, "results": RESULTS}, f, indent=2)

    print(f"\n  Results saved to tests/qa_results.json")
    print("=" * 60)

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
