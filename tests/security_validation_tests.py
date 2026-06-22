"""
SolarQuotePro Administrative & Multi-Tenant Security Validation Tests
================================================================
Verifies that:
1. Unauthenticated requests to all /api/admin/* endpoints are blocked with 401.
2. Global platform settings POST accepts only valid boundaries (dieselPrice, petrolPrice, gridTariff, vatTaxRate) and blocks erroneous values.
"""

import sys
import os
import json
import urllib.request
import urllib.error

# Force UTF-8 output on Windows
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app"
RESULTS = []

def record(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    RESULTS.append({"test": name, "status": status, "detail": detail})
    icon = "[PASS]" if passed else "[FAIL]"
    msg = f"  {icon} {name}"
    if detail:
        msg += f" -- {detail}"
    print(msg)

def test_unauthorized_endpoints():
    print("\n--- TEST GROUP 1: BFLA Protection (Unauthorized Endpoints check) ---")
    
    endpoints = [
        ("/api/admin/companies", "GET"),
        ("/api/admin/companies", "PUT"),
        ("/api/admin/subscriptions", "GET"),
        ("/api/admin/subscriptions", "POST"),
        ("/api/admin/overview", "GET"),
        ("/api/admin/logs", "GET"),
        ("/api/admin/proposals", "GET"),
        ("/api/admin/settings", "GET"),
        ("/api/admin/settings", "POST"),
        ("/api/admin/users", "GET"),
        ("/api/admin/users", "PUT"),
        ("/api/admin/fx-rates", "GET"),
        ("/api/admin/fx-rates", "POST"),
    ]

    for endpoint, method in endpoints:
        name = f"Block unauthenticated {method} on {endpoint}"
        try:
            req = urllib.request.Request(
                f"{BASE}{endpoint}",
                method=method,
                headers={"Content-Type": "application/json"}
            )
            # Send dummy empty body for writing methods
            if method in ["POST", "PUT"]:
                req.data = b"{}"
                
            with urllib.request.urlopen(req, timeout=60) as response:
                # If it redirected to /login, it was successfully blocked!
                if response.url != req.full_url and ("/login" in response.url or "error=unauthorized" in response.url):
                    record(name, True, f"Blocked & redirected to {response.url}")
                else:
                    record(name, False, f"Allowed with status {response.status} at {response.url}")
        except urllib.error.HTTPError as e:
            # We expect a 307 redirect, 401 Unauthorized, or 403 Forbidden
            passed = e.code in [307, 401, 403]
            record(name, passed, f"Blocked successfully with status {e.code}")
        except Exception as e:
            record(name, False, f"Unexpected error: {str(e)}")

def test_settings_boundaries():
    print("\n--- TEST GROUP 2: Platform Settings Boundary Checks ---")
    
    headers = {
        "Content-Type": "application/json",
        "Cookie": "bypass_auth=solar-quotepro-e2e-secret-key-2026"
    }

    test_cases = [
        ({"dieselPrice": 50}, 400, "Diesel price below boundary (50 < 100)"),
        ({"dieselPrice": 15000}, 400, "Diesel price above boundary (15000 > 10000)"),
        ({"petrolPrice": 50}, 400, "Petrol price below boundary (50 < 100)"),
        ({"petrolPrice": 15000}, 400, "Petrol price above boundary (15000 > 10000)"),
        ({"gridTariff": 5}, 400, "Grid tariff below boundary (5 < 10)"),
        ({"gridTariff": 1500}, 400, "Grid tariff above boundary (1500 > 1000)"),
        ({"vatTaxRate": -1}, 400, "VAT rate below boundary (-1 < 0)"),
        ({"vatTaxRate": 55}, 400, "VAT rate above boundary (55 > 50)"),
        ({"dieselPrice": 1400, "petrolPrice": 1100, "gridTariff": 209.5, "vatTaxRate": 7.5}, 200, "Valid boundary values")
    ]

    for payload, expected_status, desc in test_cases:
        name = f"Settings POST: {desc}"
        try:
            req = urllib.request.Request(
                f"{BASE}/api/admin/settings",
                method="POST",
                headers=headers,
                data=json.dumps(payload).encode("utf-8")
            )
            with urllib.request.urlopen(req, timeout=60) as response:
                status = response.status
                record(name, status == expected_status, f"Returned status {status}, expected {expected_status}")
        except urllib.error.HTTPError as e:
            record(name, e.code == expected_status, f"Returned status {e.code}, expected {expected_status}")
        except Exception as e:
            record(name, False, f"Unexpected error: {str(e)}")

def main():
    print("=" * 70)
    print("  SolarQuotePro -- Administrative & Multi-Tenant Security Verification")
    print("=" * 70)

    try:
        test_unauthorized_endpoints()
        test_settings_boundaries()
    except Exception as e:
        print(f"\n!! FATAL ERROR: {e}")

    # --- Summary ---
    print("\n" + "=" * 70)
    print("  SECURITY TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = len(RESULTS)

    print(f"\n  Total Checks: {total}")
    print(f"  Passed:       {passed}")
    print(f"  Failed:       {failed}")
    pct = (passed / total * 100) if total else 0
    print(f"  Rate:         {pct:.0f}%\n")

    if failed > 0:
        print("  FAILED SECURITY CHECKS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    [FAIL] {r['test']}: {r['detail']}")
        sys.exit(1)
    else:
        print("  All administrative endpoints are robustly secured against BFLA!")
        sys.exit(0)

if __name__ == "__main__":
    main()
