import { NextResponse } from 'next/server';
import { verifyAdmin, AdminRole } from '@/utils/adminAuth';

const DEFAULT_MOCK_ADMINS = [
  { id: 'pa-1', user_id: 'dev-admin-id', email: 'admin@solarquotepro.com', role: 'superadmin', created_at: new Date().toISOString() },
  { id: 'pa-2', user_id: 'user-inst-1', email: 'ops@solarquotepro.com', role: 'operations', created_at: new Date().toISOString() },
  { id: 'pa-3', user_id: 'user-inst-2', email: 'billing@solarquotepro.com', role: 'billing', created_at: new Date().toISOString() },
  { id: 'pa-4', user_id: 'user-inst-3', email: 'viewer@solarquotepro.com', role: 'read_only', created_at: new Date().toISOString() }
];

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (auth.isBypassed) {
    return NextResponse.json({
      admins: DEFAULT_MOCK_ADMINS,
      currentRole: auth.role
    });
  }

  try {
    // Retrieve all platform admins from database
    const { data: admins, error } = await auth.adminClient
      .from('platform_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Resolve emails from auth users
    const { data: { users }, error: usersError } = await auth.adminClient.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    if (!usersError && users) {
      users.forEach((u: any) => {
        emailMap[u.id] = u.email || 'N/A';
      });
    }

    const resolvedAdmins = (admins || []).map((admin: any) => ({
      ...admin,
      email: emailMap[admin.user_id] || admin.email || 'N/A'
    }));

    return NextResponse.json({
      admins: resolvedAdmins,
      currentRole: auth.role
    });

  } catch (error: any) {
    console.error('Failed to retrieve platform admins, falling back to mock data:', error);
    return NextResponse.json({
      admins: DEFAULT_MOCK_ADMINS,
      currentRole: auth.role
    });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  // Mutating team roles is strictly restricted to SuperAdmin
  if (!auth.canManageTeam) {
    return NextResponse.json({ error: 'Permission denied: SuperAdmin role required to manage team roles.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, userId, targetRole } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required.' }, { status: 400 });
    }

    if (auth.isBypassed) {
      return NextResponse.json({ success: true, message: `Action ${action} executed successfully (Simulated).` });
    }

    switch (action) {
      case 'update_role': {
        if (!userId || !targetRole) {
          return NextResponse.json({ error: 'userId and targetRole are required.' }, { status: 400 });
        }

        // Prevent updating own role to lock yourself out
        if (userId === auth.user?.id) {
          return NextResponse.json({ error: 'Safety Guard: You cannot demote/modify your own active role.' }, { status: 400 });
        }

        const { data, error } = await auth.adminClient
          .from('platform_admins')
          .update({ role: targetRole })
          .eq('user_id', userId);

        if (error) throw error;

        // Log this action in operations telemetry
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'admin_role_change',
          status: 'success',
          initiated_by: auth.user?.id || null,
          payload: { targetUserId: userId, targetRole },
          response_details: `Admin role updated to ${targetRole}.`,
          duration_ms: 0
        });

        return NextResponse.json({ success: true });
      }

      case 'add_admin': {
        const { email, role } = body;
        if (!email || !role) {
          return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
        }

        // 1. Locate auth user by email
        const { data: { users }, error: listError } = await auth.adminClient.auth.admin.listUsers();
        if (listError) throw listError;

        const targetUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!targetUser) {
          return NextResponse.json({ error: 'No user registered with this email address. The user must sign up first.' }, { status: 404 });
        }

        // Check if already an admin
        const { data: existingAdmin } = await auth.adminClient
          .from('platform_admins')
          .select('id')
          .eq('user_id', targetUser.id)
          .maybeSingle();

        if (existingAdmin) {
          return NextResponse.json({ error: 'User is already a platform admin.' }, { status: 400 });
        }

        // 2. Insert into platform_admins
        const { error: insertError } = await auth.adminClient
          .from('platform_admins')
          .insert({
            user_id: targetUser.id,
            role
          });

        if (insertError) throw insertError;

        // Log this action in operations telemetry
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'admin_role_change',
          status: 'success',
          initiated_by: auth.user?.id || null,
          payload: { targetUserId: targetUser.id, targetRole: role, targetEmail: email },
          response_details: `New administrator added with role ${role}.`,
          duration_ms: 0
        });

        return NextResponse.json({ success: true });
      }

      case 'remove_admin': {
        if (!userId) return NextResponse.json({ error: 'userId is required.' }, { status: 400 });

        if (userId === auth.user?.id) {
          return NextResponse.json({ error: 'Safety Guard: You cannot delete your own admin registration.' }, { status: 400 });
        }

        // Enforce Last-Admin Guard
        const { data: allAdmins } = await auth.adminClient.from('platform_admins').select('user_id');
        if (allAdmins && allAdmins.length <= 1) {
          return NextResponse.json({ error: 'Safety Block: Accidental deactivation would orphan platform governance.' }, { status: 400 });
        }

        const { error } = await auth.adminClient
          .from('platform_admins')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Failed to complete admin team member operation:', error);
    return NextResponse.json({ error: `Operation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
