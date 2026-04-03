"use client"

import { useState } from "react"
import { Spinner } from "@/app/components/ui"

export default function SubscribeWidget({ pageId }: { pageId: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, page_id: pageId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus("success")
      setMessage("subscribed. you will get an email when new updates ship.")
      setEmail("")
    } catch (err: unknown) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "something went wrong")
    }
  }

  if (status === "success") {
    return (
      <div className="px-4 py-3 rounded-xl bg-green-500/[0.08] border border-green-500/[0.2]">
        <p className="text-[11px] font-mono text-green-400">{message}</p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="cp-input flex-1 font-mono text-xs"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="cp-btn-secondary text-xs px-4 gap-1.5 whitespace-nowrap"
        >
          {status === "loading" ? <><Spinner size={12} />subscribing...</> : "subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-[10px] font-mono text-red-400 mt-2">{message}</p>
      )}
    </div>
  )
}
