import Link from "next/link";
import {
  Bot,
  ChartColumnIncreasing,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const pillars = [
  {
    title: "Real-time Tracking",
    description:
      "See stock updates instantly across products, categories, and suppliers.",
    icon: Zap,
  },
  {
    title: "Automated Alerts",
    description:
      "Get notified before low-stock issues become fulfillment problems.",
    icon: Bot,
  },
  {
    title: "Insightful Analytics",
    description:
      "Use trend insights to optimize purchasing and reduce waste.",
    icon: ChartColumnIncreasing,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <section className="text-center">
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          <Sparkles size={14} />
          Inventory Precision Platform
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
          Inventory management,
          <br />
          perfected.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Gain complete control over products, stock flow, and supplier operations from one
          modern dashboard built for growing teams.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="ui-btn-primary">
            Start for free
          </Link>
          <Link href="/login" className="ui-btn-secondary">
            Book demo
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/70 bg-[#071326] p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] sm:p-6">
          <div className="rounded-xl border border-blue-100/10 bg-linear-to-br from-[#0f274b] via-[#0b1f3f] to-[#08172d] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">SmartStock</p>
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              {["Products", "Stock Value", "Low Stock", "Suppliers"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-blue-100">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 h-40 rounded-lg border border-white/10 bg-linear-to-t from-white/5 to-white/0 sm:h-48" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              {["Orders", "Transactions", "Turnover", "Forecast"].map((item) => (
                <div key={item} className="h-8 rounded bg-white/6" aria-hidden="true">
                  <span className="sr-only">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {[
            "AI Insight",
            "Forecasting",
            "Live Updates",
            "Precision",
            "Scalable",
          ].map((item) => (
            <div key={item} className="inline-flex items-center gap-1.5">
              <Star size={13} className="text-zinc-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Engineered for Operational Excellence
          </h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="ui-panel rounded-2xl p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon size={18} />
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">{pillar.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="rounded-2xl border border-indigo-900/30 bg-linear-to-r from-[#1b1433] to-[#0e1733] px-6 py-9 text-center shadow-[0_16px_40px_rgba(17,24,39,0.35)]">
          <h2 className="text-2xl font-semibold text-white">Ready to optimize your stock?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-indigo-100/80">
            Launch your modern inventory workflow with stockmind in minutes.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="ui-btn-primary">
              Create free account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Contact sales
            </Link>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-indigo-100/80">
            <ShieldCheck size={14} />
            Trusted by operations teams and growing businesses.
          </div>
        </div>
      </section>
    </div>
  );
}
