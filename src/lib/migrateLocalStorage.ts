import { supabase } from '@/lib/supabase/client'
import { SavedProposal } from '@/store/historyStore'

/**
 * Migrates local-only proposals (stored in localStorage) to the Supabase database.
 * Matches keys starting with 'solarquotepro_proposal_' and updates local 'synced' state.
 */
export async function migrateLocalStorageData() {
  if (typeof window === 'undefined') return { success: false, migrated: 0 }

  // 1. Verify user session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { success: false, migrated: 0 }

  // 2. Fetch all keys in localStorage
  const keys = Object.keys(localStorage)
  const proposalKeys = keys.filter(key => key.startsWith('solarquotepro_proposal_'))

  if (proposalKeys.length === 0) return { success: true, migrated: 0 }

  let migratedCount = 0

  for (const key of proposalKeys) {
    try {
      const dataStr = localStorage.getItem(key)
      if (!dataStr) continue

      const savedItem: SavedProposal = JSON.parse(dataStr)

      // Skip already synced records
      if (savedItem.synced) continue

      // Send to SaaS API proposals route
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: savedItem.id,
          proposal: savedItem.proposal,
          calculations: savedItem.calculations
        })
      })

      if (response.ok) {
        migratedCount++
        // Mark local cache as synced
        const updatedItem = { ...savedItem, synced: true }
        localStorage.setItem(key, JSON.stringify(updatedItem))
      }
    } catch (err) {
      console.error(`[Migration] Failed to sync local proposal key: ${key}`, err)
    }
  }

  return { success: true, migrated: migratedCount }
}
