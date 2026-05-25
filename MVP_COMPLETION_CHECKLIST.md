# Solar ROI Proposal Builder - MVP Completion Checklist

## 1. Wizard & Calculations 🧮 ✅
- [x] **Step 1 (Load Entry):** Ensure users cannot proceed without adding at least one appliance. Validate wattage > 0 and hours > 0.
- [x] **Step 2 (Preferences):** Verify NEPA hours + Gen hours <= 24. Ensure Peak Sun Hours is between 3 and 6.
- [x] **Step 3 (Hardware):** Confirm that the selected inverter capacity is >= calculated peak surge (including inductive surge).
- [x] **Step 4 (ROI):** Validate that the NEPA/Gen savings calculation correctly reflects the Naira difference between the old setup and the new solar setup. Payback period should not display `NaN` or `Infinity`.
- [x] **Step 5 (Finalize):** Ensure installer markup, VAT, and discounts result in a correctly formatted final Naira price.

## 2. Validation & Error Handling 🛡️ ✅
- [x] Try to skip Step 1 with no appliances -> Verify "Please add at least one appliance to continue." error shows.
- [x] Try entering text instead of numbers for NEPA Tariff -> Verify "Tariff must be a valid number." error shows.
- [x] Test extreme values (e.g., 50kVA load on a budget system) -> Verify graceful warning instead of app crash.
- [x] Ensure "Next" buttons are disabled until the current step is valid.

## 3. Offline & Sync Reliability 📡 ✅
- [x] Go offline (turn off Wi-Fi/data or use DevTools).
- [x] Create a new proposal from start to finish.
- [x] Verify the proposal appears in the Dashboard's "Recent Proposals" list.
- [x] Come back online.
- [x] Verify the `SyncProvider` successfully flushes the proposal to Supabase (check Network tab or Supabase dashboard).
- [x] Reload the page while offline -> Verify the wizard loads instantly using the Service Worker.

## 4. Final PDF/Print Experience 🖨️ ✅
- [x] Open a completed proposal and click "Print / Save as PDF".
- [x] Verify the page margins are clean (1cm margins applied successfully).
- [x] Confirm no page breaks occur inside the "Equipment Bill of Materials" table or the "How We Sized" boxes.
- [x] Ensure the Installer Logo, Primary Color, and Secondary Color are accurately applied in the print preview.
- [x] Verify background colors render properly (`print-color-adjust: exact`).

## 5. Analytics & Tracking 📊 ✅
- [x] Open the Console and verify `[EVENT] step_completed` fires when clicking Next.
- [x] Verify `[EVENT] proposal_generated` fires when reaching the print page.
- [x] Trigger an intentional validation error and verify it isn't throwing unhandled exceptions.

## 6. Nigerian Fuel Pricing (May 2026) ⛽ ✅
- [x] **FUEL_PRICES_NGN constant** exported from `calculations.ts` — Petrol ₦1,250/L, Diesel ₦1,750/L.
- [x] **wizardStore state** migrated from single `gen_fuel_price_per_liter` to structured `fuelPrices: { petrolPerLitre, dieselPerLitre }`.
- [x] **Step 2 UI** — Editable petrol/diesel price fields in System Preferences, persisted to proposal state.
- [x] **Step 4 ROI** — Dynamically reads `fuelPrices` for the selected fuel type; shows calculation footnote (price × rate × hours × 30.4 days).
- [x] **Step 5 WhatsApp** — Monthly savings use live fuel prices from state.
- [x] **PDF Print Footer** — Discloses the exact petrol/diesel prices used in the ROI calculation.
- [x] **Sync Provider** — Maps `fuelPrices` → `gen_fuel_price_per_liter` DB column for Supabase sync.
- [x] **Demo Loader** — Updated to use ₦1,250/₦1,750 defaults.

## 7. Build & Config Fixes 🔧 ✅
- [x] **Turbopack config** — Added `turbopack: {}` to `next.config.ts` for Next.js 16 compatibility.
- [x] **Suspense boundary** — Wrapped `useSearchParams()` in `<Suspense>` on `/proposals/new`.
- [x] **ROIChart type fix** — Fixed recharts Tooltip `formatter` ValueType mismatch.
