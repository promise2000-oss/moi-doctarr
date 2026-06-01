import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useToastContext } from '../context/ToastContext'
import { getAccessToken } from '../services/api'

export default function OtpVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, resendVerificationCode, isAuthenticated } = useAuth()
  const { addToast } = useToastContext()

  const email = (location.state as { email?: string } | null)?.email || 'your email'
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < 6) {
      inputRefs.current[index]?.focus()
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '')
    if (!digit) return
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    setIsError(false)
    setErrorMsg('')
    if (index < 5) focusInput(index + 1)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        focusInput(index - 1)
      } else if (otp[index] !== '') {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'Enter') {
      if (otp.every(d => d !== '')) handleVerify()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pastedData) return
    const newOtp = [...otp]
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char
    })
    setOtp(newOtp)
    const nextIndex = Math.min(pastedData.length, 5)
    focusInput(nextIndex)
  }

  const handleResend = useCallback(async () => {
    if (isResending) return
    if (!getAccessToken()) {
      addToast('Session expired. Please sign in again.', 'error')
      navigate('/sign-in', { replace: true })
      return
    }
    setIsResending(true)
    setOtp(Array(6).fill(''))
    setIsError(false)
    setErrorMsg('')
    await resendVerificationCode()
    setIsResending(false)
    addToast('A new code has been sent to your email.', 'success')
    setTimeout(() => focusInput(0), 50)
  }, [isResending, resendVerificationCode, addToast, navigate, focusInput])

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setIsError(true)
      setErrorMsg('Please enter the full 6-digit code.')
      return
    }

    setIsVerifying(true)
    const ok = await verifyEmail(code)
    if (ok) {
      navigate('/', { replace: true })
    } else {
      setIsVerifying(false)
      setIsError(true)
      setErrorMsg('Invalid or expired code. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <main className="w-full max-w-[440px]">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-10 flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
          {/* Icon */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Icon icon="mark_email_read" className="text-[32px]" />
            </div>
            <div className="text-center">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Verify Your Email</h1>
              <p className="mt-2 text-secondary font-body-md text-body-md">
                Enter the verification code sent to
              </p>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">{email}</p>
            </div>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center gap-2 md:gap-3 w-full">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                autoComplete="one-time-code"
                autoFocus={i === 0}
                className={`w-11 h-13 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center font-headline-md text-headline-md rounded-xl border bg-surface text-on-surface transition-all duration-200 outline-none ${
                  isError && !digit ? 'border-error animate-shake' : 'border-outline-variant'
                } ${isError && !digit ? '' : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}
                  ${isVerifying ? 'opacity-50 pointer-events-none' : ''}`}
                maxLength={1}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                aria-label={`Digit ${i + 1} of 6`}
              />
            ))}
          </div>

          {/* Error */}
          {isError && (
            <p className="font-caption text-caption text-error flex items-center gap-1 -mt-2" role="alert">
              <Icon icon="error" className="text-[16px]" />
              {errorMsg}
            </p>
          )}

          {/* Verify Button */}
          <button
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3.5 md:py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm hover:shadow-md active:scale-[0.98]"
            type="button"
            onClick={handleVerify}
            disabled={otp.some(d => !d) || isVerifying}
            aria-label="Verify email code"
          >
            {isVerifying ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="flex items-center justify-center gap-1.5 font-body-md">
            <span className="text-secondary text-sm">Didn't receive the code?</span>
            <button
              className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 focus:outline-none focus:underline text-sm disabled:opacity-50 flex items-center gap-1"
              disabled={isVerifying || isResending}
              onClick={handleResend}
              aria-label="Resend verification code"
            >
              {isResending ? (
                <>
                  <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : 'Resend Code'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
