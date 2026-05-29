'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sun, ArrowRight, Loader2 } from 'lucide-react'

function LoginForm() {
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams?.get('next') ?? '/workspace'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      if (!companyName.trim()) {
        toast.error('Please enter your solar company name.')
        setLoading(false)
        return
      }

      // Register new user with company metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextRoute)}`
        }
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Registration successful! Please check your email for the confirmation link.')
      }
    } else {
      // Sign in existing user
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Signed in successfully!')
        router.push(nextRoute)
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md w-full space-y-8 relative z-10">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-850 dark:text-slate-50">SolarPro</span>
        </Link>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {isSignUp ? 'Installer Sign Up' : 'Installer Sign In'}
        </h2>
        <p className="mt-2 text-sm text-slate-655 dark:text-slate-400 font-medium">
          {isSignUp ? 'Register to build and brand professional proposals' : 'Enter your credentials to access your dashboard'}
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-xl rounded-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Solar Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  required
                  placeholder="e.g. Lagos Sunshine Power"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-teal-650 dark:text-teal-400 font-extrabold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Already have an installer account? Sign In' : 'New to SolarPro? Register Installer Profile'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <React.Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-sm font-medium text-slate-500 animate-pulse">Loading auth portal...</span>
        </div>
      }>
        <LoginForm />
      </React.Suspense>
    </div>
  )
}
