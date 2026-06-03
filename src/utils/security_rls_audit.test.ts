// src/utils/security_rls_audit.test.ts

import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock server client imports
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

describe('SolarPro SaaS Security & RLS Leak Audit', () => {
  
  describe('Automated Migration-Time RLS Checks (Static Analysis)', () => {
    it('verifies that every database table created in migrations has RLS enabled', () => {
      const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
      
      if (!fs.existsSync(migrationsDir)) {
        // Skip check if migrations folder doesn't exist
        return
      }

      const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
      const createdTables = new Set<string>()
      const rlsEnabledTables = new Set<string>()

      migrationFiles.forEach(file => {
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf8')

        // Capture table creations
        // Matches e.g. "CREATE TABLE IF NOT EXISTS public.clients" or "CREATE TABLE proposals"
        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi
        let match
        while ((match = createTableRegex.exec(sql)) !== null) {
          const tableName = match[1].toLowerCase()
          // Exclude transient/system tables if any
          createdTables.add(tableName)
        }

        // Capture ALTER TABLE ... ENABLE ROW LEVEL SECURITY
        const enableRlsRegex = /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi
        while ((match = enableRlsRegex.exec(sql)) !== null) {
          rlsEnabledTables.add(match[1].toLowerCase())
        }
      })

      // We allow standard schema_migrations or metadata/Postgres system tables to skip
      const tablesMissingRls = Array.from(createdTables).filter(
        table => !rlsEnabledTables.has(table)
      )

      expect(tablesMissingRls).toEqual([])
    })
  })

  describe('Integration Tenancy & Subscription Gating Controls', () => {
    it('verifies the API blocks proposal creation (POST) when company subscription status is past due', async () => {
      const { POST } = await import('@/app/api/proposals/route')
      const { createClient } = await import('@/lib/supabase/server')

      // Mock user authentication session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-past-due-id' } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'company_members') {
            return {
              select: () => ({
                eq: () => ({
                  single: () => ({
                    data: { company_id: 'company-past-due-id' },
                    error: null
                  })
                })
              })
            }
          }
          if (table === 'companies') {
            return {
              select: () => ({
                eq: () => ({
                  single: () => ({
                    data: { subscription_tier: 'pro', subscription_status: 'past_due' },
                    error: null
                  })
                })
              })
            }
          }
          return {}
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const mockRequest = new Request('http://localhost/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          proposal: { customer_name: 'Leak Test Client' },
          calculations: {}
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(403)
      
      const json = await response.json()
      expect(json.error).toContain('Your workspace subscription is past due or cancelled')
    })

    it('verifies the API blocks proposal creation (POST) when Starter tier quota is exceeded (10 proposals)', async () => {
      const { POST } = await import('@/app/api/proposals/route')
      const { createClient } = await import('@/lib/supabase/server')

      // Mock user authentication session for starter tier with 10 proposals
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-starter-id' } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'company_members') {
            return {
              select: () => ({
                eq: () => ({
                  single: () => ({
                    data: { company_id: 'company-starter-id' },
                    error: null
                  })
                })
              })
            }
          }
          if (table === 'companies') {
            return {
              select: () => ({
                eq: () => ({
                  single: () => ({
                    data: { subscription_tier: 'starter', subscription_status: 'active', proposal_usage_count: 10 },
                    error: null
                  })
                })
              })
            }
          }
          if (table === 'proposals') {
            return {
              select: () => ({
                eq: () => ({
                  data: null,
                  count: 10, // Already has 10 proposals
                  error: null
                })
              })
            }
          }
          return {}
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const mockRequest = new Request('http://localhost/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          proposal: { customer_name: 'Quota Exceed Client' },
          calculations: {}
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(403)
      
      const json = await response.json()
      expect(json.error).toContain('Proposal limit reached')
    })
  })
})
