"use client"

import { ArrowRight, ChatBubbleLeftRight } from "@medusajs/icons"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { STORE_INFO, whatsappLink } from "@lib/store-config"
import { MEMBER_BENEFITS } from "@modules/account/components/auth-ui"
import Login from "@modules/account/components/login"
import Register from "@modules/account/components/register"
import Stamp from "@modules/common/components/stamp"
import { clx } from "@modules/common/components/ui"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const HELP_MESSAGE = "Merhaba, üyelik / giriş konusunda yardım almak istiyorum."

/** One text block inside the sliding panel; cross-fades when the view changes. */
const PanelSlide = ({
  active,
  hiddenOffset,
  children,
}: {
  active: boolean
  /** where the block drifts to while hidden */
  hiddenOffset: string
  children: React.ReactNode
}) => (
  <div
    inert={!active}
    className={clx(
      "absolute inset-0 flex flex-col justify-center px-12 transition-all motion-reduce:transition-none",
      // the leaving text clears quickly, the arriving one fades in once the
      // panel is well on its way
      active
        ? "translate-x-0 opacity-100 duration-500 delay-300"
        : `pointer-events-none opacity-0 duration-200 ${hiddenOffset}`
    )}
  >
    {children}
  </div>
)

const PANEL_BUTTON =
  "inline-flex h-11 items-center gap-x-2 self-start rounded-xl border-2 border-brand-fg/80 px-6 text-[15px] font-semibold transition-colors hover:bg-brand-fg hover:text-brand"

/**
 * Sign-in and register forms side by side, with a turquoise panel that slides
 * over the inactive one (desktop). Phones get a tab switch and the forms slide
 * in. The view lives in the URL (?view=register) so it can be linked to and
 * the back button works.
 */
const LoginTemplate = ({
  guestCheckoutHref,
}: {
  guestCheckoutHref?: string | null
}) => {
  const searchParams = useSearchParams()
  const view =
    searchParams.get("view") === LOGIN_VIEW.REGISTER
      ? LOGIN_VIEW.REGISTER
      : LOGIN_VIEW.SIGN_IN
  const isRegister = view === LOGIN_VIEW.REGISTER

  const signInRef = useRef<HTMLElement>(null)
  const registerRef = useRef<HTMLElement>(null)
  const hasSwitched = useRef(false)

  const setView = (next: LOGIN_VIEW) => {
    if (next === view) {
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    if (next === LOGIN_VIEW.REGISTER) {
      params.set("view", LOGIN_VIEW.REGISTER)
    } else {
      params.delete("view")
    }
    const query = params.toString()
    hasSwitched.current = true
    window.history.pushState(
      null,
      "",
      query ? `?${query}` : window.location.pathname
    )
  }

  // After a switch, move focus to the new form's heading so keyboard and
  // screen reader users are not left on a control that just disappeared.
  useEffect(() => {
    if (!hasSwitched.current) {
      return
    }
    const pane = isRegister ? registerRef.current : signInRef.current
    pane?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true })
  }, [isRegister])

  const paneClass = (active: boolean, enter: string) =>
    clx(
      "flex-col justify-center px-5 py-8 xsmall:p-10 small:flex small:px-10 small:py-8",
      "small:transition-opacity small:duration-500 motion-reduce:transition-none",
      active
        ? `flex ${enter} motion-reduce:animate-none small:animate-none small:opacity-100 small:delay-200`
        : "hidden small:opacity-0"
    )

  return (
    <div className="mx-auto w-full">
      {/* Phone / tablet: tab switch */}
      <div
        role="group"
        aria-label="Giriş yap veya üye ol"
        className="mb-4 grid grid-cols-2 rounded-full bg-brand-100 p-1 small:hidden"
      >
        {[
          { value: LOGIN_VIEW.SIGN_IN, label: "Giriş yap" },
          { value: LOGIN_VIEW.REGISTER, label: "Üye ol" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={view === tab.value}
            onClick={() => setView(tab.value)}
            className={clx(
              "h-10 rounded-full text-sm font-semibold transition-all",
              view === tab.value
                ? "bg-white text-navy shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-navy/70 hover:text-navy"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] small:grid small:grid-cols-2">
        <section
          ref={signInRef}
          inert={isRegister}
          aria-label="Giriş yap"
          className={paneClass(!isRegister, "animate-pane-in-left")}
        >
          <Login guestCheckoutHref={guestCheckoutHref} />
        </section>
        <section
          ref={registerRef}
          inert={!isRegister}
          aria-label="Üye ol"
          className={paneClass(isRegister, "animate-pane-in-right")}
        >
          <Register />
        </section>

        {/* Desktop: turquoise panel covering the inactive form */}
        <div
          className={clx(
            "absolute inset-y-0 left-1/2 z-10 hidden w-1/2 p-2 small:block",
            "transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none",
            isRegister && "-translate-x-full"
          )}
        >
          <div className="relative flex h-full flex-col overflow-hidden rounded-[20px] bg-brand text-brand-fg">
            <Stamp
              text={`Üyelere özel • ${STORE_INFO.name} • `}
              className="pointer-events-none absolute -right-5 -top-5 -rotate-12 text-brand-fg/25"
            />

            <div className="relative flex-1">
              <PanelSlide active={!isRegister} hiddenOffset="translate-x-8">
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-brand-fg/75">
                  Yeni misiniz?
                </span>
                <h2 className="mt-2 text-[28px] font-bold leading-tight">
                  Hesabınız yok mu?
                </h2>
                <p className="mt-2 max-w-sm text-[15px] text-brand-fg/85">
                  Üye olun, alışverişin size özel tarafını açın.
                </p>
                <ul className="my-6 flex flex-col gap-y-2.5">
                  {MEMBER_BENEFITS.map(({ Icon, text }) => (
                    <li key={text} className="flex items-center gap-x-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-fg/15">
                        <Icon />
                      </span>
                      <span className="text-[15px] font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setView(LOGIN_VIEW.REGISTER)}
                  className={PANEL_BUTTON}
                  data-testid="register-switch-button"
                >
                  Üye ol
                  <ArrowRight />
                </button>
              </PanelSlide>

              <PanelSlide active={isRegister} hiddenOffset="-translate-x-8">
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-brand-fg/75">
                  Tekrar hoş geldiniz
                </span>
                <h2 className="mt-2 text-[28px] font-bold leading-tight">
                  Zaten üye misiniz?
                </h2>
                <p className="mb-7 mt-2 max-w-sm text-[15px] text-brand-fg/85">
                  Siparişlerinize, tekliflerinize ve size özel fiyatlara
                  ulaşmak için giriş yapın.
                </p>
                <button
                  type="button"
                  onClick={() => setView(LOGIN_VIEW.SIGN_IN)}
                  className={PANEL_BUTTON}
                  data-testid="sign-in-switch-button"
                >
                  Giriş yap
                  <ArrowRight />
                </button>
              </PanelSlide>
            </div>

            <a
              href={whatsappLink(HELP_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mx-12 mb-7 inline-flex h-9 items-center gap-x-2 self-start rounded-full bg-whatsapp px-4 text-sm font-semibold text-navy transition-colors hover:bg-whatsapp-dark"
            >
              <ChatBubbleLeftRight />
              Yardım mı lazım? WhatsApp&apos;tan yazın
            </a>
          </div>
        </div>
      </div>

      {/* Phone / tablet: benefits under the form */}
      <div className="mt-4 rounded-2xl bg-brand-50 p-5 small:hidden">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest text-brand-ink">
          Üyelere özel
        </p>
        <ul className="flex flex-col gap-y-2.5">
          {MEMBER_BENEFITS.map(({ Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-x-3 text-sm text-navy"
            >
              <Icon className="shrink-0 text-brand-ink" />
              {text}
            </li>
          ))}
        </ul>
        <a
          href={whatsappLink(HELP_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-9 items-center gap-x-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-navy transition-colors hover:bg-whatsapp-dark"
        >
          <ChatBubbleLeftRight />
          Yardım mı lazım? WhatsApp&apos;tan yazın
        </a>
      </div>
    </div>
  )
}

export default LoginTemplate
