import Link from "next/link"
import { Logo } from "@/app/components/ui"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface overflow-hidden">

      {/* grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <Logo />
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-xs text-text-dim hover:text-text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="text-xs text-text-dim hover:text-text-primary transition-colors">Pricing</Link>
          <Link href="/login" className="text-xs text-text-dim hover:text-text-primary transition-colors">Sign in</Link>
          <Link href="/login" className="cp-btn-primary text-xs px-3 py-1.5">Get started free</Link>
        </div>
      </nav>

      {/* hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          <span className="text-[11px] font-mono text-text-muted">now in public beta</span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight leading-[1.08] mb-6 animate-fade-up">
          <span className="text-text-primary">Your changelog,</span>
          <br />
          <span className="text-text-dim">written by AI</span>
        </h1>

        <p className="text-base text-text-muted max-w-lg mx-auto leading-relaxed mb-10 animate-fade-up-delay">
          Connect your GitHub repo. Push code. ChangePatch automatically writes,
          publishes, and emails your changelog every time you ship.
        </p>

        <div className="flex items-center justify-center gap-3 animate-fade-up-delay-2">
          <Link href="/login" className="cp-btn-primary px-5 py-2.5">
            Start for free
          </Link>
         
        </div>
      </section>

      {/* demo window */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 pb-24 animate-fade-up-delay-3">
        <div className="cp-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[11px] font-mono text-text-ghost ml-2">changepatch.com/changelog/my-saas-app</span>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {[[
              { type: "feat", title: "CSV export for reports", desc: "Download any report as a CSV file directly from the reports page.", time: "2h ago" },
              { type: "fix", title: "Fixed profile page crash", desc: "Resolved an issue when loading certain user profiles.", time: "Yesterday" },
              { type: "improve", title: "3x faster dashboard", desc: "Improved data fetching and caching throughout the app.", time: "3 days ago" },
            ]].flat().map((entry, i) => (
              <div key={i} className="bg-surface-2 border border-white/[0.05] rounded-lg p-4">
                <div className={`cp-badge mb-3 ${
                  entry.type === "feat" ? "cp-badge-feat" :
                  entry.type === "fix" ? "cp-badge-fix" : "cp-badge-improve"
                }`}>{entry.type}</div>
                <p className="text-[13px] font-medium text-text-primary mb-1.5 leading-snug">{entry.title}</p>
                <p className="text-[11px] text-text-dim leading-relaxed mb-2">{entry.desc}</p>
                <p className="text-[10px] font-mono text-text-ghost">{entry.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative z-10 max-w-4xl mx-auto px-8 py-16 border-t border-white/[0.06]">
        <p className="text-[11px] font-mono text-text-ghost uppercase tracking-widest text-center mb-12">How it works</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { step: "01", title: "Connect your repo", desc: "OAuth in 60 seconds. Read-only access to commit history. No code changes required." },
            { step: "02", title: "Push code", desc: "Every push to your main branch triggers automatic AI analysis of your commits." },
            { step: "03", title: "Review and publish", desc: "AI writes the draft. You review, edit if needed, tick reviewed, and publish." },
          ].map((item) => (
            <div key={item.step} className="cp-card p-5">
              <span className="text-[11px] font-mono text-text-ghost mb-3 block">{item.step}</span>
              <h3 className="text-sm font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-[13px] text-text-dim leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="relative z-10 max-w-4xl mx-auto px-8 py-16 border-t border-white/[0.06]">
        <p className="text-[11px] font-mono text-text-ghost uppercase tracking-widest text-center mb-12">Pricing</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Free", price: "$0", period: "forever", features: ["1 repo", "5 generations/mo", "Public changelog page", "ChangePatch branding"], cta: "Get started", highlight: false },
            { name: "Starter", price: "$19", period: "/month", features: ["3 repos", "Unlimited generations", "No branding", "Email digest", "Email support"], cta: "Start free trial", highlight: true },
            { name: "Growth", price: "$49", period: "/month", features: ["10 repos", "Custom domain", "Branded email", "GitLab support", "Priority support"], cta: "Start free trial", highlight: false },
          ].map((plan) => (
            <div key={plan.name} className={`cp-card p-5 ${plan.highlight ? "border-white/[0.16] bg-surface-2" : ""}`}>
              {plan.highlight && <p className="text-[10px] font-mono text-green-400 mb-3">most popular</p>}
              <h3 className="text-sm font-semibold text-text-primary mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-text-primary">{plan.price}</span>
                <span className="text-xs text-text-dim font-mono">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[12px] text-text-muted">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`block text-center text-xs font-medium py-2 rounded-lg transition-all ${plan.highlight ? "bg-white text-surface hover:bg-white/90" : "cp-btn-secondary"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-8 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-[11px] font-mono text-text-ghost">built with changepatch</p>
        </div>
      </footer>

    </main>
  )
}
