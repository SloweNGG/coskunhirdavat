import React, { useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  /** small icon shown inside the field, before the text */
  icon?: React.ReactNode
  placeholder?: string
  /** shown at the right end of the label row, e.g. a "forgot password" link */
  labelAction?: React.ReactNode
  /** adds a muted "(isteğe bağlı)" after the label */
  optional?: boolean
}

/**
 * Label above a soft grey field, optional leading icon. Password fields get a
 * show/hide toggle and a Caps Lock warning.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      name,
      label,
      touched: _touched,
      errors: _errors,
      required,
      topLabel,
      icon,
      id,
      placeholder,
      className,
      labelAction,
      optional,
      onKeyDown,
      onKeyUp,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLock, setCapsLock] = useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type
    const inputId = id ?? name

    useImperativeHandle(ref, () => inputRef.current!)

    const trackCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isPassword) {
        setCapsLock(e.getModifierState("CapsLock"))
      }
    }

    return (
      <div className="flex w-full flex-col gap-y-1.5">
        <div className="flex items-baseline justify-between gap-x-3">
          <label htmlFor={inputId} className="text-sm font-medium text-navy">
            {topLabel ?? label}
            {required && <span className="text-rose-500">*</span>}
            {optional && (
              <span className="ml-1 font-normal text-muted">
                (isteğe bağlı)
              </span>
            )}
          </label>
          {labelAction}
        </div>
        <div className="flex h-11 w-full items-center gap-x-3 rounded-xl border border-transparent bg-soft px-4 transition-colors focus-within:border-navy/25 focus-within:bg-white hover:bg-grey-10">
          {icon && (
            <>
              <span className="shrink-0 text-navy/40" aria-hidden>
                {icon}
              </span>
              <span className="h-4 w-px shrink-0 bg-navy/15" aria-hidden />
            </>
          )}
          <input
            type={inputType}
            name={name}
            id={inputId}
            required={required}
            placeholder={placeholder ?? ""}
            className={`h-full w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-navy/35 ${
              className ?? ""
            }`}
            onKeyDown={(e) => {
              trackCapsLock(e)
              onKeyDown?.(e)
            }}
            onKeyUp={(e) => {
              trackCapsLock(e)
              onKeyUp?.(e)
            }}
            onBlur={(e) => {
              setCapsLock(false)
              onBlur?.(e)
            }}
            {...props}
            ref={inputRef}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="shrink-0 text-navy/50 hover:text-navy"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
        {isPassword && (
          <p
            aria-live="polite"
            className="text-xs font-medium text-amber-700 empty:hidden"
          >
            {capsLock ? "Caps Lock açık" : null}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
