import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../components/GoogleIcon'
import AppleIcon from '../components/AppleIcon'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false })

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordsMatch = password === confirmPassword
  const hasMinLen = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const strengthChecks = [hasMinLen, hasUpper, hasNumber, hasSpecial]
  const strengthScore = strengthChecks.filter(Boolean).length
  const isStrong = strengthScore === 4

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { text: '', color: '' }
    if (strengthScore <= 1) return { text: 'Weak', color: 'text-error' }
    if (strengthScore <= 2) return { text: 'Fair', color: 'text-amber-500' }
    if (strengthScore <= 3) return { text: 'Good', color: 'text-blue-500' }
    return { text: 'Strong', color: 'text-green-500' }
  }, [strengthScore, password.length])

  const strengthProgressColor = useMemo(() => {
    if (password.length === 0) return 'bg-secondary-fixed-dim'
    if (strengthScore <= 1) return 'bg-error'
    if (strengthScore <= 2) return 'bg-amber-500'
    if (strengthScore <= 3) return 'bg-blue-500'
    return 'bg-green-500'
  }, [strengthScore, password.length])

  useEffect(() => {
    if (error) {
      // reset shake key to allow re-shake on next error
    }
  }, [error])

  const validate = () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.')
      setShakeKey(k => k + 1)
      return false
    }
    if (emailError) {
      setError('Please enter a valid email address.')
      setShakeKey(k => k + 1)
      return false
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      setShakeKey(k => k + 1)
      return false
    }
    if (!isStrong) {
      setError('Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.')
      setShakeKey(k => k + 1)
      return false
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      setShakeKey(k => k + 1)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ name: true, email: true, password: true, confirm: true })
    if (!validate()) return
    setIsSubmitting(true)
    const result = await signUp(fullName.trim(), email.trim(), password)
    setIsSubmitting(false)
    if (result.success) {
      navigate('/verify-email', { state: { email: email.trim() } })
    } else {
      setError(result.error)
      setShakeKey(k => k + 1)
    }
  }

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

  const handleApple = useCallback(() => {
    setOauthLoading('apple')
    setError('')
    setTimeout(() => {
      setOauthLoading(null)
      setError('Apple sign-in is not yet available.')
      setShakeKey(k => k + 1)
    }, 500)
  }, [])

  const requirements = [
    { label: 'At least 8 characters', met: hasMinLen },
    { label: '1 uppercase letter', met: hasUpper },
    { label: '1 number', met: hasNumber },
    { label: '1 special character', met: hasSpecial },
  ]

  const inputBase = 'w-full bg-surface-container-low border rounded-xl px-4 py-3.5 md:py-3 font-body-md text-body-md text-on-surface outline-none transition-all duration-200 placeholder:text-secondary-fixed-dim'
  const inputNormal = 'border-secondary-fixed focus:border-primary focus:ring-2 focus:ring-primary/20'
  const inputError = 'border-error focus:border-error focus:ring-2 focus:ring-error/20'

  function inputWrapper(error?: boolean) {
    return `${inputBase} ${error ? inputError : inputNormal}`
  }

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
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Create your account</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">Join MoiDoctar and take control of your health</p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error-container/20 border border-error/30 text-error"
            role="alert"
            aria-live="polite"
          >
            <Icon icon="error" className="text-xl shrink-0 mt-0.5" aria-hidden="true" />
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
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="signup-name">Full Name</label>
            <div className="relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 border-secondary-fixed">
              <Icon icon="badge" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="signup-name"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-3.5 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, name: true }))}
                aria-required="true"
                aria-invalid={touched.name && !fullName.trim() ? true : undefined}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="signup-email">Email Address</label>
            <div className={`relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low ${emailError ? inputError : inputNormal}`}>
              <Icon icon="mail" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="signup-email"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-3.5 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                aria-required="true"
                aria-invalid={emailError || undefined}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
              />
            </div>
            {emailError && (
              <p id="signup-email-error" className="font-caption text-caption text-error mt-0.5 flex items-center gap-1" role="alert">
                <Icon icon="error" className="text-[14px]" aria-hidden="true" />
                Enter a valid email address.
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="signup-password">Password</label>
            <div className="relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 border-secondary-fixed">
              <Icon icon="lock" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="signup-password"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-10 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, password: true }))}
                aria-required="true"
                aria-describedby="password-requirements"
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
            {/* Strength bar + requirements */}
            {password.length > 0 && (
              <div className="mt-2 space-y-2 animate-fade-in" id="password-requirements">
                <div className="flex justify-between items-center">
                  <span className="font-caption text-caption text-secondary">Password strength</span>
                  <span className={`font-caption text-caption font-medium ${strengthLabel.color}`}>{strengthLabel.text}</span>
                </div>
                <div className="h-1.5 bg-secondary-fixed-dim rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strengthProgressColor}`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  />
                </div>
                <ul className="space-y-1.5 mt-3">
                  {requirements.map((req, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 font-caption text-caption transition-colors duration-300 ${
                        req.met ? 'text-green-500' : 'text-secondary'
                      }`}
                    >
                      <Icon icon="check_circle" className="text-[16px]" aria-hidden="true" />
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="signup-confirm">Confirm Password</label>
            <div className={`relative flex items-center border rounded-xl transition-all duration-200 bg-surface-container-low ${
              touched.confirm && !passwordsMatch ? inputError : inputNormal
            }`}>
              <Icon icon="lock" className="ml-3.5 text-secondary shrink-0" aria-hidden="true" />
              <input
                id="signup-confirm"
                className="w-full bg-transparent border-none py-3.5 md:py-3 pl-2.5 pr-3.5 font-body-md text-body-md focus:ring-0 rounded-xl text-on-surface placeholder-secondary-fixed-dim outline-none"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                aria-required="true"
                aria-invalid={touched.confirm && !passwordsMatch ? true : undefined}
              />
            </div>
            {touched.confirm && !passwordsMatch && confirmPassword.length > 0 && (
              <p className="font-caption text-caption text-error mt-0.5 flex items-center gap-1" role="alert">
                <Icon icon="error" className="text-[14px]" aria-hidden="true" />
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-outline text-primary focus:ring-primary/30 focus:ring-2 transition-colors cursor-pointer"
              aria-label="I agree to the Terms of Service and Privacy Policy"
            />
            <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline focus:outline-none focus:underline" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline focus:outline-none focus:underline" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!fullName.trim() || !email.trim() || !password || !confirmPassword || !agreeTerms || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3.5 md:py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm hover:shadow-md active:scale-[0.98]"
            aria-label="Create your account"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Bottom link */}
        <p className="text-center font-body-md text-body-md text-secondary">
          Already have an account?{' '}
          <Link className="text-primary font-bold hover:underline focus:outline-none focus:underline" to="/sign-in">Log in</Link>
        </p>
      </div>
    </div>
  )
}
