"use client"

import { setOrderNote } from "@lib/data/cart"
import { ChatBubbleLeftRight, Plus } from "@medusajs/icons"
import { useState } from "react"
import { SUMMARY_TOGGLE } from "../cta-class"

/** "Sipariş notu ekle": optional note for the store, saved when the field loses focus. */
const OrderNote = ({ initialNote }: { initialNote?: string }) => {
  const [open, setOpen] = useState(!!initialNote)
  const [note, setNote] = useState(initialNote ?? "")
  const [saved, setSaved] = useState(initialNote ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")

  const save = async () => {
    if (note.trim() === saved.trim()) return
    setStatus("saving")
    await setOrderNote(note).catch(() => {})
    setSaved(note)
    setStatus("saved")
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={SUMMARY_TOGGLE}
        data-testid="add-order-note-button"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink">
          <ChatBubbleLeftRight aria-hidden />
        </span>
        Sipariş notu ekle
        <Plus aria-hidden className="ml-auto text-navy/50" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-y-1.5">
      <label htmlFor="order-note" className="text-sm font-medium text-navy">
        Sipariş notu
      </label>
      <textarea
        id="order-note"
        rows={3}
        maxLength={500}
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          setStatus("idle")
        }}
        onBlur={save}
        placeholder="Örn. teslimat saati, kapı kodu, ürünle ilgili isteğiniz…"
        className="w-full resize-none rounded-xl border border-transparent bg-soft px-3 py-2 text-sm text-navy outline-none focus:border-navy/25 focus:bg-white"
        data-testid="order-note-input"
      />
      <span className="text-xs text-muted" aria-live="polite">
        {status === "saving"
          ? "Kaydediliyor…"
          : status === "saved"
          ? "Notunuz kaydedildi."
          : ""}
      </span>
    </div>
  )
}

export default OrderNote
