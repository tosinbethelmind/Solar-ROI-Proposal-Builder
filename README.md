This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Live Production URL:** [https://solar-roi-proposal-builder.vercel.app](https://solar-roi-proposal-builder.vercel.app)

*Note: SolarQuotePro (Proposal Builder for Nigerian Installers) is designed to help installers build and share proposals. Recent updates include fully responsive layouts for the admin companies date-range filter on mobile.*

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## E2E Testing with Playwright & Supabase Auth

This project includes a fully automated Playwright E2E test suite that runs with pre-authenticated Supabase sessions.

### Running Tests

To run the E2E tests:

```bash
npm run test:e2e
```

### Global Auth Setup & Seeding

The test suite utilizes a global auth setup script (`tests/e2e/global-setup.ts`):
1. **User Seeding**: If the `SUPABASE_SERVICE_ROLE_KEY` environment variable is defined, the global setup script will automatically seed or verify two test accounts in your Supabase instance:
   - **Admin**: `admin@test.local` (password: `Admin123Password!`) with superadmin privileges in the `platform_admins` table.
   - **Installer**: `installer@test.local` (password: `Installer123Password!`) with a default company workspace.
2. **Session Storage**: The script signs in both users via the Supabase client and writes their authenticated browser states (including cookies and localStorage session data) to:
   - `tests/e2e/.auth/admin.json`
   - `tests/e2e/.auth/installer.json`
3. **Session Reuse**: Playwright projects (`admin` and `installer`) reuse these cached JSON files, bypassing the login UI for every individual test.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
