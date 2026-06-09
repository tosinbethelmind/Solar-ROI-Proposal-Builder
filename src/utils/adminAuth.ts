import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/utils/supabaseAdmin';

export async function verifyAdmin() {
  const adminClient = createAdminClient();
  const userClient = await createClient();

  let isBypassed = false;
  try {
    const cookieStore = await cookies();
    const bypassCookie = cookieStore.get('bypass_auth')?.value;
    isBypassed = process.env.NODE_ENV === 'development' && bypassCookie === 'true';
  } catch (e) {
    // ignore cookies error (e.g. outside of request context or not in server context)
  }

  if (isBypassed) {
    return {
      isAdmin: true,
      user: { id: 'dev-admin-id', email: 'admin@solarpro.com' },
      adminClient,
      userClient,
      isBypassed: true
    };
  }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return {
      isAdmin: false,
      user: null,
      errorStatus: 401,
      errorMsg: 'Unauthorized administrative operation.',
      adminClient,
      userClient,
      isBypassed: false
    };
  }

  // Verify if user is platform administrator in the database
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !error && !!data;
  if (!isAdmin) {
    return {
      isAdmin: false,
      user,
      errorStatus: 403,
      errorMsg: 'Forbidden: Platform administrative authorization required.',
      adminClient,
      userClient,
      isBypassed: false
    };
  }

  return {
    isAdmin: true,
    user,
    adminClient,
    userClient,
    isBypassed: false
  };
}
