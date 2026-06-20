import { cookies } from 'next/headers'

export async function isE2EBypassed() {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('bypass_auth')?.value === 'solar-quotepro-e2e-secret-key-2026'
  } catch (e) {
    return false
  }
}
