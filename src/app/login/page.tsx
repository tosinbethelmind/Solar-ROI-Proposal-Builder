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
import { CopyrightYear } from '@/components/ui/CopyrightYear'
import { LegalNotice } from '@/components/ui/LegalNotice'
import { 
  Sun, 
  ArrowRight, 
  Loader2, 
  FileText, 
  Globe, 
  Share2, 
  Mail, 
  Phone, 
  Lock,
  ChevronLeft
} from 'lucide-react'

// Env flags
const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
const PHONE_OTP_ENABLED = process.env.NEXT_PUBLIC_PHONE_OTP_ENABLED === 'true'

function LoginForm() {
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [usePhoneOtp, setUsePhoneOtp] = React.useState(false)
  
  // Credentials
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  
  // Phone OTP Flow
  const [phone, setPhone] = React.useState('')
  const [otpSent, setOtpSent] = React.useState(false)
  const [otpToken, setOtpToken] = React.useState('')
  
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams?.get('next') ?? '/workspace'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (usePhoneOtp) {
      // Phone OTP Verification
      if (otpSent) {
        if (!otpToken || otpToken.length !== 6) {
          toast.error('Please enter a valid 6-digit OTP code.')
          setLoading(false)
          return
        }

        const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0+/, '')}`
        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otpToken,
          type: 'sms'
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Signed in successfully!')
          router.push(nextRoute)
          router.refresh()
        }
      } else {
        // Send OTP
        if (!phone) {
          toast.error('Please enter a valid phone number.')
          setLoading(false)
          return
        }

        // Format to +234 format for Nigeria
        const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0+/, '')}`
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success(`OTP code sent to ${formattedPhone}!`)
          setOtpSent(true)
        }
      }
      setLoading(false)
      return
    }

    // Email/Password flow
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first to reset your password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent! Please check your inbox.')
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextRoute)}`
      }
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 relative z-10 px-4">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
            <Sun className="h-5 w-5 text-white animate-spin-slow" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-850 dark:text-slate-50">SolarQuotePro</span>
        </Link>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {usePhoneOtp 
            ? (otpSent ? 'Enter Verification Code' : 'Sign In with Phone')
            : (isSignUp ? 'Installer Sign Up' : 'Installer Sign In')
          }
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
          {usePhoneOtp
            ? (otpSent ? 'Enter the 6-digit code sent to your phone' : 'Enter your phone number to receive a secure login OTP')
            : (isSignUp ? 'Register to build and brand professional proposals' : 'Enter your credentials to access your dashboard')
          }
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-xl rounded-3xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Phone OTP login UI */}
            {usePhoneOtp ? (
              <div className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="e.g. 08031234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl pl-10 border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Standard Nigerian formats accepted (auto-prefixes +234).</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="otpToken" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verification Code</Label>
                    <Input
                      id="otpToken"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="rounded-xl text-center text-lg tracking-widest font-black border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : otpSent ? (
                    <>
                      <span>Verify &amp; Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Send Security OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-slate-500 hover:underline flex items-center gap-1 mx-auto mt-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back to edit phone number
                  </button>
                )}
              </div>
            ) : (
              // Email / Password UI
              <div className="space-y-4">
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl pl-10 border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-teal-655 dark:text-teal-400 hover:underline font-bold"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl pl-10 border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
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
              </div>
            )}
          </form>

          {/* Social Sign-ins and Toggles */}
          <div className="mt-6 space-y-4">
            
            {/* Conditional Google Sign-in */}
            {GOOGLE_AUTH_ENABLED && (
              <div className="space-y-3">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase font-black tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-10 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.856 5.856 0 01-5.856-5.857c0-3.235 2.62-5.856 5.856-5.856 1.454 0 2.784.53 3.806 1.4l3.056-3.056C18.91 3.23 15.79 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.202 0 10.24-4.364 10.24-10.24 0-.69-.06-1.355-.175-1.955H12.24z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            )}

            {/* Conditional Phone OTP toggle button */}
            {PHONE_OTP_ENABLED && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setUsePhoneOtp(!usePhoneOtp)
                  setOtpSent(false)
                }}
                className="w-full text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 rounded-xl"
              >
                {usePhoneOtp ? 'Use Email & Password' : 'Sign In with Phone SMS OTP'}
              </Button>
            )}

            {/* Toggle Sign up / Sign in */}
            {!usePhoneOtp && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-teal-650 dark:text-teal-400 font-extrabold hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Already have an installer account? Sign In' : 'New to SolarQuotePro? Register Installer Profile'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Left Column: Auth Forms */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative Blurs */}
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <React.Suspense fallback={
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="text-sm font-medium text-slate-500 animate-pulse">Loading auth portal...</span>
          </div>
        }>
          <LoginForm />
        </React.Suspense>
      </div>

      {/* Right Column: Feature Preview Panel (Visible on Desktop only) */}
      <div className="hidden md:flex flex-1 bg-slate-900 text-white relative flex-col justify-center px-12 lg:px-20 overflow-hidden border-l border-slate-800">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md space-y-8 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              SolarQuotePro Installer Suite
            </span>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              What&apos;s waiting inside <span className="text-teal-400">→</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Join Nigeria&apos;s fastest growing network of residential &amp; commercial solar installers. Scale your business, build custom estimates, and win client trust.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <FileText className="w-5 h-5 text-teal-400" />,
                title: "Branded PDF Proposals",
                desc: "Generate professional estimates with custom margins, VAT, company logo, and local compliance details in under 3 minutes."
              },
              {
                icon: <Globe className="w-5 h-5 text-emerald-450" />,
                title: "Live Parallel FX Engine",
                desc: "We auto-fetch parallel exchange rates to convert component pricing accurately between USD and Naira in real-time."
              },
              {
                icon: <Share2 className="w-5 h-5 text-teal-400" />,
                title: "WhatsApp Sharing Integration",
                desc: "Send interactive, mobile-optimized sizing reports and PDF proposal links directly to clients' WhatsApp inbox."
              }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all duration-300 group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors shrink-0">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">{feature.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <div>
              <span>© <CopyrightYear /> SolarQuotePro NG</span>
              <LegalNotice />
            </div>
            <span>Reliable solar operations</span>
          </div>
        </div>
      </div>
    </div>
  )
}
