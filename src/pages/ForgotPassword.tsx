import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { api } from '../services/api'

type Step = 'email' | 'reset' | 'done'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/requestPasswordReset', { email: email.trim() }, null)
      setStep('reset')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) { setError('Enter the full 6-digit code.'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await api.post('/user/forgotPassword', { email: email.trim(), verificationCode: code, newPassword }, null)
      setStep('done')
    } catch (err) {
      const e = err as { err?: string }
      setError(e?.err === 'user_not_found' ? 'Invalid code. Please try again.' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-level-1 border border-secondary-fixed p-8 flex flex-col gap-6 relative z-10">

        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center text-primary">
            <Icon icon={step === 'done' ? 'check_circle' : 'lock_reset'} className="text-4xl" />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {step === 'email' ? 'Forgot Password' : step === 'reset' ? 'Reset Password' : 'Password Updated'}
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-2">
              {step === 'email' && 'Enter your email and we\'ll send a reset code.'}
              {step === 'reset' && `Enter the 6-digit code sent to ${email} and choose a new password.`}
              {step === 'done' && 'Your password has been updated. You can now sign in.'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-container/20 border border-error/30 text-error">
            <Icon icon="error" className="text-xl shrink-0" />
            <p className="font-body-md text-sm">{error}</p>
          </div>
        )}

        {/* Step 1 — Enter email */}
        {step === 'email' && (
          <form className="flex flex-col gap-5" onSubmit={handleRequestCode}>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="reset-email">Email Address</label>
              <div className="relative flex items-center bg-surface-container-low border border-secondary-fixed rounded-lg">
                <Icon icon="mail" className="text-secondary ml-3 absolute" />
                <input
                  id="reset-email"
                  className="w-full bg-transparent border-none py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder-secondary-fixed-dim focus:ring-0 rounded-lg outline-none"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3 rounded-full transition-colors duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
              type="submit"
              disabled={!email.trim() || loading}
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2 — Enter code + new password */}
        {step === 'reset' && (
          <form className="flex flex-col gap-5" onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="reset-code">6-Digit Code</label>
              <input
                id="reset-code"
                className="w-full bg-surface-container-low border border-secondary-fixed rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-widest text-center text-xl"
                placeholder="000000"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="new-password">New Password</label>
              <div className="relative flex items-center bg-surface-container-low border border-secondary-fixed rounded-lg">
                <Icon icon="lock" className="text-secondary ml-3 absolute" />
                <input
                  id="new-password"
                  className="w-full bg-transparent border-none py-3 pl-10 pr-10 font-body-md text-body-md text-on-surface placeholder-secondary-fixed-dim focus:ring-0 rounded-lg outline-none"
                  placeholder="Minimum 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 text-secondary hover:text-on-surface p-1">
                  <Icon icon={showPassword ? 'visibility' : 'visibility_off'} />
                </button>
              </div>
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3 rounded-full transition-colors duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
              type="submit"
              disabled={code.length !== 6 || newPassword.length < 8 || loading}
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</> : 'Update Password'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setNewPassword(''); setError('') }} className="text-secondary text-sm hover:text-primary text-center">
              Didn't receive a code? Try again
            </button>
          </form>
        )}

        {/* Step 3 — Done */}
        {step === 'done' && (
          <button
            onClick={() => navigate('/sign-in')}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3 rounded-full transition-colors duration-200"
          >
            Go to Sign In
          </button>
        )}

        <div className="text-center mt-2">
          <Link className="text-primary font-bold hover:underline inline-flex items-center gap-1" to="/sign-in">
            <Icon icon="arrow_back" className="text-[18px]" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
