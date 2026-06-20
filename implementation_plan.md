# Mobile Responsiveness Fix for Admin Companies Page

## Goal Description

The date‑range filter on **Admin → Companies** still displays as a desktop‑only layout on mobile devices. The inputs do not stack vertically, and the container does not use the full width of the viewport. This results in a poor user experience on phones and tablets.

The user also requested that the Vercel deployment link in the README be updated.

## User Review Required

> [!IMPORTANT]
> Please confirm the exact Vercel deployment URL you would like to use (e.g., `https://solar-roi-proposal-builder.vercel.app`). If you have a custom domain, provide that instead.

## Open Questions

- Do you want any additional mobile‑only styling (e.g., larger tap targets, increased font size) for the date inputs?
- Should the surrounding filter bar also switch to a column layout on mobile, or is the current flex‑col behaviour sufficient?

## Proposed Changes

---
### src/app/admin/companies/page.tsx

- Replace the date‑range container class with a fully responsive layout:
  ```tsx
  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
  ```
- Add `flex-1` to the input classNames so they expand to the available width on small screens:
  ```tsx
  className="flex-1 w-full sm:w-auto h-10.5 ..."
  ```
- Ensure the separator `–` has margin for spacing on mobile.
- Adjust the parent `CardContent` flex direction to `flex-col` on mobile (already uses `lg:flex-row`). No change needed but confirm.

---
### README.md

- Update the **Deploy on Vercel** badge/URL with the user‑provided Vercel link.
- Add a short note about the mobile responsiveness fix.

---
## Verification Plan

### Automated Tests
- Run `npm run dev` and use Playwright (or the built‑in browser subagent) to open the page at `http://localhost:3000/admin/companies` with a viewport width of 375 px (iPhone SE).
- Capture screenshots of the date‑range filter before and after the change.
- Assert that the two `<input type="date">` elements each have a width of `100%` in the mobile viewport.

### Manual Verification
- Deploy to Vercel (or preview URL) and open the page on a real mobile device to confirm the layout.
- Verify that the Vercel link in the README points to the correct URL.

**Next Step:** Await user confirmation of the Vercel URL and any additional mobile styling preferences before applying the changes.
