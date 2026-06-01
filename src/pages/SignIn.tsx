import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../components/GoogleIcon'
import AppleIcon from '../components/AppleIcon'

export default function SignIn() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [touched, setTouched] = useState({ email: false, password: false })

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await signInWithGoogle(tokenResponse.access_token)
      setOauthLoading(null)
      if (!result.success) {
        setError(result.error)
        setShakeKey(k => k + 1)
      }
    },
    onError: () => {
      setOauthLoading(null)
      setError('Google sign-in failed. Please try again.')
      setShakeKey(k => k + 1)
    },
  })

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validate = () => {
    if (!email.trim() || !password) {
      setError('Incorrect email or password')
      setShakeKey(k => k + 1)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setIsSubmitting(true)
    const result = await signIn(email.trim(), password, rememberMe)
    setIsSubmitting(false)
    if (!result.success) {
      if (result.needsVerification) {
        navigate('/verify-email', { state: { email: result.pendingEmail ?? email.trim() } })
        return
      }
      setError(result.error)
      setShakeKey(k => k + 1)
    }
  }

  const handleApple = useCallback(() => {
    setOauthLoading('apple')
    setError('')
    setTimeout(() => {
      setOauthLoading(null)
      setError('Apple sign-in is not yet available.')
      setShakeKey(k => k + 1)
    }, 500)
  }, [])

  const inputBase = 'w-full bg-surface-container-low border rounded-xl px-4 py-3.5 md:py-3 font-body-md text-body-md text-on-surface outline-none transition-all duration-200 placeholder:text-secondary-fixed-dim'
  const inputNormal = 'border-secondary-fixed focus:border-primary focus:ring-2 focus:ring-primary/20'
  const inputError = 'border-error focus:border-error focus:ring-2 focus:ring-error/20'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <div
        key={shakeKey}
        className={`w-full max-w-[440px] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-10 flex flex-col gap-5 md:gap-6 animate-fade-in ${
          error ? 'animate-shake' : ''
        }`}
      >
        {/* Logo + Tagline */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/doctarr.jpeg" alt="MoiDoctar" className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-sm" />
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">MoiDoctar</h1>
            <p className="font-body-md text-body-md text-secondary mt-0.5">Health Triage</p>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Welcome back</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">Log in to access your health records</p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-container/20 border border-error/30 text-error"
            role="alert"
            aria-live="polite"
          >
            <Icon icon="error" className="text-xl shrink-0" aria-hidden="true" />
            <p className="font-body-md text-sm flex-1">{error}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { setError(''); setOauthLoading('google'); googleLogin() }}
            disabled={oauthLoading !== null}
            aria-label="Continue with Google"
            className="w-full flex items-center justify-center gap-3 py-3.5 md:py-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 font-label-md text-label-md text-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {oauthLoading === 'google' ? (
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleApple}
            disabled={oauthLoading !== null}
            aria-label="Continue with Apple"
            className="w-full flex items-center justify-center gap-3 py-3.5 md:py-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 font-label-md text-label-md text-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {oauthLoading === 'apple' ? (
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <AppleIcon className="w-5 h-5" />
            )}
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
          <div className="h-px bg-secondary-fixed flex-1" />
          <span className="font-caption text-caption text-secondary shrink-0">or continue with email</span>
          <div className="h-px bg-secondary-fixed flex-1" />
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4 md:gap-5" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="login-email">Email</label>
            <div className={`relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low ${emailError ? inputError : inputNormal}`}>
              <Icon icon="mail" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="login-email"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-3.5 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                aria-invalid={emailError || undefined}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                aria-required="true"
              />
            </div>
            {emailError && (
              <p id="login-email-error" className="font-caption text-caption text-error mt-0.5 flex items-center gap-1" role="alert">
                <Icon icon="error" className="text-[14px]" aria-hidden="true" />
                Enter a valid email address.
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="login-password">Password</label>
              <Link className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline" to="/forgot-password" tabIndex={0}>
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Icon icon="lock" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="login-password"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-10 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onBlur={() => setTouched(p => ({ ...p, password: true }))}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 text-secondary hover:text-on-surface transition-colors p-1 focus:outline-none focus:text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <Icon icon={showPassword ? 'visibility' : 'visibility_off'} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-outline text-primary focus:ring-primary/30 focus:ring-2 transition-colors cursor-pointer"
              aria-label="Remember me for 30 days"
            />
            <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">Remember me for 30 days</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!email.trim() || !password || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3.5 md:py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm hover:shadow-md active:scale-[0.98]"
            aria-label="Log in to your account"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Bottom link */}
        <p className="text-center font-body-md text-body-md text-secondary">
          Don&apos;t have an account?{' '}
          <Link className="text-primary font-bold hover:underline focus:outline-none focus:underline" to="/sign-up">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
