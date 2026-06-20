'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut } from 'lucide-react'

export function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-medium text-slate-600 dark:text-slate-400 md:inline-block max-w-[150px] truncate">
          {user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => router.push('/login')}
      className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
    >
      <LogIn className="h-4 w-4" />
      <span>Sign In</span>
    </Button>
  )
}
