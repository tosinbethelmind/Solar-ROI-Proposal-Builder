# Retry Vercel Deployment and Verify Theme Contrast

## Goal Description

The recent deployment to Vercel failed with an `ECONNRESET` error during the API polling step. We need to retry the deployment, ensure it succeeds, and then verify that the light/dark theme toggle works and that pricing sections have sufficient contrast and readability.

## User Review Required

> [!IMPORTANT]
> Please confirm that it is acceptable to re‑run the Vercel deployment command. If you have any specific deployment flags or environment variables you would like to adjust, let us know.

## Open Questions

> [!QUESTION]
> - Do you want us to use the same Vercel project (`betelmindrecruit-9250s-projects`) or a different one?
> - Should we increase the polling timeout or use the `--prod` flag?

## Proposed Changes

---
### [MODIFY] [deploy.sh](file:///c:/Users/HomePC/Desktop/website%20Projects/Solar%20ROI%20Proposal%20Builder/deploy.sh)
- Add a retry wrapper around the `vercel` CLI command.
- Include `--yes` to skip prompts and `--cwd .` to ensure correct working directory.
- Optionally set `VERCEL_TIMEOUT=600` environment variable.

---
### [NEW] [verify_theme.js](file:///c:/Users/HomePC/Desktop/website%20Projects/Solar%20ROI%20Proposal%20Builder/verify_theme.js)
- Small Node script using Puppeteer to open the live Vercel URL, toggle the theme, capture screenshots, and exit with status code 0 if all checks pass.

## Verification Plan

### Automated Tests
- Run `bash deploy.sh` and monitor exit code.
- Execute `node verify_theme.js` to programmatically confirm the UI renders correctly in both modes.

### Manual Verification
- After deployment, open the live URL in a browser and manually confirm the pricing cards are readable in both light and dark modes.
