# Solar ROI Proposal Builder - QA & MVP Readiness Checklist

This document tracks the final quality assurance checks for the Solar ROI Proposal Builder before the pilot rollout.

## 1. Offline PWA Flow (Pass)
- [x] **Service Worker Registration:** Validated that `next-pwa` successfully compiles and registers `sw.js`.
- [x] **Manifest Parsing:** Validated that `manifest.json` is correctly structured (Standalone mode, correct icons and theme colors).
- [x] **Offline Status Detection:** Validated that the `useSyncExternalStore` hook accurately detects when the browser goes offline and displays the "Offline Mode" badge in the UI without cascading updates.
- [x] **Store Persistence:** Validated that Zustand `persist` correctly stores the full `proposal` and `calculations` objects in local storage, surviving page reloads without network access.
- [x] **Offline Images/Logos:** Confirmed that the `installer_logo_url` accepts Base64 Data URIs so logos can render correctly in the Print route when fully offline.

## 2. Field Mode Flow (Pass)
- [x] **Global Toggle:** Validated that the `useUiStore` `fieldMode` boolean seamlessly toggles the layout without requiring page reloads.
- [x] **Step 1 (Appliances):** Confirmed that enabling Field Mode collapses the granular consumption charts and replaces delicate slider inputs with large, mobile-optimized `+/-` stepper buttons.
- [x] **Step 3 (Hardware):** Confirmed that Field Mode cleanly hides "Expert Overrides" and simplifies the complex 3-tier comparative tables to reduce visual clutter on site.

## 3. Print Route Flow (Pass)
- [x] **Print-Specific Styling:** Validated the use of `@media print` (`print:hidden`, `print:break-after-page`) to construct a seamless multi-page PDF output.
- [x] **Defensive Data Handling:** Validated that visiting `/proposals/print` without prior calculations prompts the user to return to the builder rather than crashing.
- [x] **Installer Branding Application:** Confirmed that `installer_primary_color` and `installer_secondary_color` are applied dynamically as inline styles to headers, borders, and backgrounds.
- [x] **System Sizing Transparency Page:** Validated that the "How We Sized Your System" page accurately pulls `inverterKva`, `batteryTotalUnits`, and `panelTotalWp` from the `calculations` store.
- [x] **WhatsApp Sharing:** Verified the "Share on WhatsApp" button correctly encodes a plain-text summary of the BOM and pricing, launching a `wa.me` intent.

## 4. Mobile Responsiveness Checks (Pass)
- [x] **Grid Layouts:** Verified all `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` rules function as expected to stack cards vertically on small viewports.
- [x] **Touch Targets:** Ensured all critical interaction zones (Next/Back buttons, Steppers, Navigation Links) meet minimum touch target sizes.
- [x] **Print Route on Mobile:** Ensured the Print Route remains visually readable on mobile devices before generating the PDF.

## 5. Proposal Pricing Consistency Checks (Pass)
- [x] **Tier Switching:** Verified that modifying the `selected_tier` in Step 3 dynamically recalculates the `final_quoted_price_ngn` and persists it correctly.
- [x] **Generator Comparison:** Verified that Step 4 correctly uses the `genMonthlyCost` calculated from Step 1/Step 2 inputs, and safely handles default `0` values.
- [x] **Validity Warnings:** Verified that the Step 5 Proposal Validity indicator correctly warns users when component prices are subject to USD-indexed changes.

---

### Remaining Risks & Technical Debt (Post-MVP)
1. **Dynamic Fallbacks:** Currently, if Supabase fails (e.g. offline on first load before caching), we fallback to hardcoded mock catalogues. A future upgrade should use IndexedDB to sync real catalogue items on successful loads, falling back to IndexedDB rather than mocks.
2. **Next.js Turbopack:** The PWA plugin relies heavily on Webpack. `next dev` and `next build` are explicitly instructed to use `--webpack` to avoid Turbopack conflicts.
3. **Analytics Integration:** We implemented a custom `useTracking` hook. Before full scale, this needs to be wired to a real analytics provider like PostHog.
