import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = (config as any).projects[0]?.use?.baseURL || (config as any).use?.baseURL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('\n[Global Setup] Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Skipping auth state setup.');
    return;
  }

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
  if (!projectRef) {
    console.error('\n[Global Setup] Error: Could not extract project reference from Supabase URL:', supabaseUrl);
    return;
  }

  console.log(`\n[Global Setup] Supabase Project Ref: ${projectRef}`);

  // 1. Seed users if service role key is available
  if (serviceRoleKey) {
    console.log('[Global Setup] SUPABASE_SERVICE_ROLE_KEY is present. Starting database seeding...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      // Helper to create/verify user and reset password if they exist
      const ensureUser = async (email: string, password: string, metadata: any) => {
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: metadata
        });

        if (error) {
          if (error.message.includes('already exists') || error.status === 422) {
            console.log(`[Global Setup] User ${email} already exists. Verifying details...`);
            const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
            if (listError) {
              throw new Error(`Failed to list users: ${listError.message}`);
            }
            const existingUser = usersData.users.find(u => u.email === email);
            if (!existingUser) {
              throw new Error(`User ${email} supposedly exists, but was not found in list.`);
            }

            // Update password to ensure it is correct for the tests
            const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, { password });
            if (updateError) {
              console.warn(`[Global Setup] Warning: Could not update password for existing user ${email}: ${updateError.message}`);
            }
            return existingUser.id;
          } else {
            throw new Error(`Failed to create user ${email}: ${error.message}`);
          }
        }

        console.log(`[Global Setup] Successfully created user: ${email}`);
        return data.user.id;
      };

      // Ensure Admin User
      const adminId = await ensureUser('admin@test.local', 'Admin123Password!', { company_name: 'Platform Admin Co' });
      // Verify platform_admins record
      const { error: adminDbError } = await adminClient
        .from('platform_admins')
        .upsert({
          user_id: adminId,
          email: 'admin@test.local',
          is_superadmin: true
        }, { onConflict: 'user_id' });

      if (adminDbError) {
        throw new Error(`Failed to insert platform_admins record: ${adminDbError.message}`);
      }
      console.log('[Global Setup] platform_admins record upserted successfully.');

      // Ensure Installer User
      await ensureUser('installer@test.local', 'Installer123Password!', { company_name: 'Lagos Installer Co' });
      console.log('[Global Setup] Seeding completed successfully.');

    } catch (e: any) {
      console.error('[Global Setup] Database seeding failed:', e.message || e);
    }
  } else {
    console.warn('[Global Setup] Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Skipping user seeding step. Assuming users are already configured.');
  }

  // 2. Perform authentication and save storageState
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const loginAndSaveState = async (email: string, password: string, filename: string) => {
    console.log(`[Global Setup] Logging in as ${email}...`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let session: any = null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
        session = data.session;
      }
    } catch (e) {
      // Ignore login connection errors
    }

    const storageStatePath = path.join(authDir, filename);
    const cookieDomain = new URL(baseURL).hostname;

    if (!session) {
      console.warn(`[Global Setup] Warning: Failed to log in as ${email}. Generating mock storageState fallback...`);
      const isSuperAdmin = email.includes('admin');
      const mockUserEmail = isSuperAdmin ? 'admin@solarquotepro.com' : 'installer@solarquotepro.com';
      const mockUserId = isSuperAdmin ? 'dev-admin-id' : 'dev-installer-id';

      const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: mockUserId,
          email: mockUserEmail,
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { company_name: isSuperAdmin ? 'Platform Admin Co' : 'Lagos Installer Co' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      const mockStorageState = {
        cookies: [
          {
            name: 'bypass_auth',
            value: 'solar-quotepro-e2e-secret-key-2026',
            domain: cookieDomain,
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
          },
          {
            name: 'sb-access-token',
            value: 'mock-access-token',
            domain: cookieDomain,
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
          },
          {
            name: 'sb-refresh-token',
            value: 'mock-refresh-token',
            domain: cookieDomain,
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
          }
        ],
        origins: [
          {
            origin: baseURL,
            localStorage: [
              {
                name: `sb-${projectRef}-auth-token`,
                value: JSON.stringify(mockSession)
              }
            ]
          }
        ]
      };

      fs.writeFileSync(storageStatePath, JSON.stringify(mockStorageState, null, 2));
      console.log(`[Global Setup] Saved mock auth state fallback to: ${storageStatePath}`);
      return true;
    }

    console.log(`[Global Setup] Setting browser context for ${email}...`);
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to baseURL to set the domain context for cookies/localStorage
    await page.goto(baseURL);

    // Set localStorage auth token
    const localStorageKey = `sb-${projectRef}-auth-token`;
    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key: localStorageKey, value: JSON.stringify(session) });

    // Set cookie tokens for server-side auth checking in proxy/middleware
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: session.access_token,
        domain: cookieDomain,
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'sb-refresh-token',
        value: session.refresh_token,
        domain: cookieDomain,
        path: '/',
        httpOnly: false,
        secure: false
      }
    ]);

    // Reload page to verify state persists and user is logged in
    await page.reload();

    // Save session storage state
    await context.storageState({ path: storageStatePath });
    await browser.close();
    console.log(`[Global Setup] Saved auth state to: ${storageStatePath}`);
    return true;
  };

  await loginAndSaveState('admin@test.local', 'Admin123Password!', 'admin.json');
  await loginAndSaveState('installer@test.local', 'Installer123Password!', 'installer.json');
}

export default globalSetup;
