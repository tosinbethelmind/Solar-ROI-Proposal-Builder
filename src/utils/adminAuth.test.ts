import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdmin, AdminRole } from './adminAuth';

const mockGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: mockGet
  })
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser
    }
  })
}));

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({
  maybeSingle: mockMaybeSingle
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect
}));

vi.mock('@/utils/supabaseAdmin', () => ({
  createAdminClient: () => ({
    from: mockFrom
  })
}));

describe('verifyAdmin', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('Bypass Auth Mode', () => {
    it('should bypass auth when bypass_auth cookie is true in development', async () => {
      mockGet.mockImplementation((name: string) => {
        if (name === 'bypass_auth') return { value: 'true' };
        if (name === 'bypass_admin_role') return { value: 'operations' };
        return undefined;
      });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.isBypassed).toBe(true);
      expect(result.role).toBe('operations');
      expect(result.isSuperAdmin).toBe(false);
      expect(result.canModifyProfiles).toBe(true);
      expect(result.canModifySubscriptions).toBe(false);
      expect(result.canRunAutomation).toBe(true);
      expect(result.canManageTeam).toBe(false);
    });

    it('should support bypass_auth with superadmin simulated role', async () => {
      mockGet.mockImplementation((name: string) => {
        if (name === 'bypass_auth') return { value: 'true' };
        if (name === 'bypass_admin_role') return { value: 'superadmin' };
        return undefined;
      });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('superadmin');
      expect(result.isSuperAdmin).toBe(true);
      expect(result.canModifyProfiles).toBe(true);
      expect(result.canModifySubscriptions).toBe(true);
      expect(result.canRunAutomation).toBe(true);
      expect(result.canManageTeam).toBe(true);
    });

    it('should support bypass_auth with billing simulated role', async () => {
      mockGet.mockImplementation((name: string) => {
        if (name === 'bypass_auth') return { value: 'true' };
        if (name === 'bypass_admin_role') return { value: 'billing' };
        return undefined;
      });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('billing');
      expect(result.isSuperAdmin).toBe(false);
      expect(result.canModifyProfiles).toBe(false);
      expect(result.canModifySubscriptions).toBe(true);
      expect(result.canRunAutomation).toBe(true);
      expect(result.canManageTeam).toBe(false);
    });

    it('should support bypass_auth with read_only simulated role', async () => {
      mockGet.mockImplementation((name: string) => {
        if (name === 'bypass_auth') return { value: 'true' };
        if (name === 'bypass_admin_role') return { value: 'read_only' };
        return undefined;
      });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('read_only');
      expect(result.isSuperAdmin).toBe(false);
      expect(result.canModifyProfiles).toBe(false);
      expect(result.canModifySubscriptions).toBe(false);
      expect(result.canRunAutomation).toBe(false);
      expect(result.canManageTeam).toBe(false);
    });
  });

  describe('Standard DB Auth Mode', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(undefined); // no bypass cookies
    });

    it('should return unauthorized if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user session') });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(false);
      expect(result.role).toBe('read_only');
      expect(result.isSuperAdmin).toBe(false);
      expect(result.canRunAutomation).toBe(false);
    });

    it('should query db and return permissions for a verified database administrator', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id', email: 'admin@domain.com' } }, error: null });
      mockMaybeSingle.mockResolvedValue({ data: { role: 'operations' }, error: null });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.isBypassed).toBe(false);
      expect(result.role).toBe('operations');
      expect(result.isSuperAdmin).toBe(false);
      expect(result.canModifyProfiles).toBe(true);
      expect(result.canModifySubscriptions).toBe(false);
      expect(result.canRunAutomation).toBe(true);
    });

    it('should default to superadmin if no role column exists but user is registered as admin', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id', email: 'admin@domain.com' } }, error: null });
      mockMaybeSingle.mockResolvedValue({ data: { id: 'admin-row-id' }, error: null });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('superadmin');
      expect(result.isSuperAdmin).toBe(true);
      expect(result.canManageTeam).toBe(true);
    });

    it('should return forbidden if user is logged in but not registered in platform_admins', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'regular-user-id', email: 'user@domain.com' } }, error: null });
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await verifyAdmin();
      expect(result.isAdmin).toBe(false);
      expect(result.role).toBe('read_only');
      expect(result.errorStatus).toBe(403);
    });
  });
});
