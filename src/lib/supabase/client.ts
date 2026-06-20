import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const realClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Check if we are running in browser and E2E bypass is active
const isBypassed = typeof window !== 'undefined' && (
  document.cookie.includes('bypass_auth=solar-quotepro-e2e-secret-key-2026') ||
  document.cookie.includes('bypass_auth=true')
)

function createMockSupabase() {
  const mockUser = { id: 'mock-installer-id', email: 'installer@test.local', user_metadata: { company_name: 'Solar Installer' } }
  const mockSession = { user: mockUser }

  const chainObj: any = new Proxy({}, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, error: new Error('Bypassed') })
      }
      if (prop === 'catch') {
        return (reject: any) => Promise.resolve({ data: null, error: new Error('Bypassed') }).catch(reject)
      }
      if (prop === 'finally') {
        return (cb: any) => Promise.resolve({ data: null, error: new Error('Bypassed') }).finally(cb)
      }
      return () => chainObj
    }
  })

  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
    getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    onAuthStateChange: (cb: any) => {
      // Defer execution slightly to let subscription store mount
      setTimeout(() => cb('SIGNED_IN', mockSession), 0)
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
    signOut: () => Promise.resolve({ error: null })
  }

  return {
    auth: mockAuth,
    from: () => chainObj
  } as any
}

export const supabase = isBypassed ? createMockSupabase() : realClient
