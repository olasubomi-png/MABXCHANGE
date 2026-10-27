import { ArrowDownUp, ArrowRight, ArrowUpRight, BadgeCheck, Globe2, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

const assets = [
  { symbol: "BTC", name: "Bitcoin", price: "$67,420.00", change: "+2.41%", positive: true, mark: "₿" },
  { symbol: "ETH", name: "Ethereum", price: "$2,485.20", change: "+1.82%", positive: true, mark: "◆" },
  { symbol: "SOL", name: "Solana", price: "$146.80", change: "−0.64%", positive: false, mark: "◎" },
  { symbol: "USDT", name: "Tether", price: "$1.00", change: "+0.01%", positive: true, mark: "₮" },
];

const features = [
  { icon: ShieldCheck, title: "Security comes first", body: "A security-conscious experience designed around account protection and clear transaction controls." },
  { icon: ArrowDownUp, title: "Crypto without the clutter", body: "A simpler way to explore buying, selling and swapping digital assets in one place." },
  { icon: Globe2, title: "Made for a connected world", body: "A flexible experience designed with supported currencies and regions in mind." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-white">
      <div className="border-b border-amber-300/15 bg-amber-300/[0.06] px-4 py-2 text-center text-xs text-amber-200 sm:text-sm">
        DEMO PREVIEW · Market figures are illustrative · Real-money transactions are disabled
      </div>

      <header className="border-b border-white/[0.08]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <a href="#" className="flex items-center gap-3" aria-label="MABXCHANGE home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-[#06110c]">M</span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">MAB<span className="text-emerald-400">XCHANGE</span></span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a className="transition hover:text-white" href="#markets">Markets</a>
            <a className="transition hover:text-white" href="#features">Why MABXCHANGE</a>
            <a className="transition hover:text-white" href="#how-it-works">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#demo" className="hidden rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:text-white sm:block">Log in</a>
            <a href="#demo" className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#06110c] transition hover:bg-emerald-300">Get started <ArrowUpRight className="ml-1 inline" size={15}/></a>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 md:py-24 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:py-28">
        <div className="pointer-events-none absolute -left-40 top-16 h-96 w-96 rounded-full bg-emerald-500/[0.10] blur-[120px]" />
        <div className="relative">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs font-medium text-emerald-300">
            <Sparkles size={14}/> A clearer way to explore crypto
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.07] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Move with the market.<br/><span className="text-emerald-400">Move with confidence.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            Buy, sell and swap digital assets through one thoughtfully designed experience. Clear quotes, transparent fees and security-minded foundations.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#demo" className="rounded-xl bg-emerald-400 px-6 py-4 font-bold text-[#06110c] transition hover:bg-emerald-300">Explore the demo <ArrowRight className="ml-2 inline" size={17}/></a>
            <a href="#markets" className="rounded-xl border border-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/5">View markets</a>
          </div>
          <div className="mt-11 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-emerald-400"/> Clear transaction previews</span>
            <span className="flex items-center gap-2"><LockKeyhole size={16} className="text-emerald-400"/> Security-conscious design</span>
          </div>
        </div>

        <div id="demo" className="relative rounded-3xl border border-white/10 bg-[#0d121d] p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-slate-400">Exchange preview</p><h2 className="mt-2 text-2xl font-semibold">Make your next move</h2></div>
            <span className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-amber-200">Demo only</span>
          </div>
          <div className="mt-7 rounded-2xl border border-white/[0.08] bg-[#080b12] p-5">
            <div className="flex justify-between text-sm"><span className="text-slate-400">You pay</span><span className="text-slate-500">Pay-in currency</span></div>
            <div className="mt-5 flex items-center justify-between gap-3"><span className="text-3xl font-medium">0.00</span><span className="rounded-xl bg-white/[0.07] px-3 py-2 text-sm">USD <span className="text-slate-500">⌄</span></span></div>
            <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs text-slate-500">Payment options depend on supported regions.</p>
          </div>
          <div className="my-[-1px] flex justify-center"><span className="z-10 rounded-xl border border-white/10 bg-[#151d29] p-3 text-emerald-400"><ArrowDownUp size={18}/></span></div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#080b12] p-5">
            <div className="flex justify-between text-sm"><span className="text-slate-400">You receive</span><span className="text-slate-500">Crypto asset</span></div>
            <div className="mt-5 flex items-center justify-between gap-3"><span className="text-3xl font-medium">0.00000</span><span className="rounded-xl bg-white/[0.07] px-3 py-2 text-sm">BTC <span className="text-slate-500">⌄</span></span></div>
            <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs text-slate-500">No live quote or transaction is available in this preview.</p>
          </div>
          <button disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-emerald-400/40 py-4 font-bold text-white/70">Trading unavailable in demo</button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">Illustrative interface only. No deposits, withdrawals or trades are processed.</p>
        </div>
      </section>

      <section id="markets" className="border-y border-white/[0.08] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-semibold tracking-widest text-emerald-400">MARKET WATCH</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Assets in focus</h2></div>
            <span className="rounded-lg border border-amber-300/20 px-3 py-2 text-xs text-amber-200">Sample data · Not live prices</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-white/[0.025] text-slate-500"><tr><th className="px-5 py-4 font-medium">Asset</th><th className="px-5 py-4 font-medium">Sample price</th><th className="px-5 py-4 text-right font-medium">Sample change</th></tr></thead>
              <tbody>{assets.map((asset) => <tr key={asset.symbol} className="border-t border-white/[0.06] transition hover:bg-white/[0.02]">
                <td className="px-5 py-5"><span className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-base font-bold text-emerald-300">{asset.mark}</span><span className="font-semibold">{asset.symbol}</span><span className="ml-3 text-slate-500">{asset.name}</span></td>
                <td className="px-5 py-5 font-medium">{asset.price}</td>
                <td className={`px-5 py-5 text-right font-medium ${asset.positive ? "text-emerald-400" : "text-rose-400"}`}>{asset.change}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-600">These figures are hard-coded placeholders for visual testing and must not be used to make financial decisions.</p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <p className="text-sm font-semibold tracking-widest text-emerald-400">THE MABXCHANGE APPROACH</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Designed for clarity at every step.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, index) => <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition hover:border-emerald-400/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/[0.09] text-emerald-400"><Icon size={23}/></span>
            <p className="mt-7 text-xs font-semibold tracking-widest text-slate-600">0{index + 1}</p>
            <h3 className="mt-2 text-xl font-semibold">{title}</h3>
            <p className="mt-4 leading-7 text-slate-400">{body}</p>
          </article>)}
        </div>
      </section>

      <section id="how-it-works" className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.09] to-transparent px-7 py-12 sm:px-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <WalletCards className="mx-auto text-emerald-400" size={32}/>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Your crypto journey, thoughtfully designed.</h2>
            <p className="mt-4 leading-7 text-slate-400">We are building the experience in stages. Account access and supported transactions will only be introduced after the necessary integrations, security reviews and regional requirements are in place.</p>
            <a href="#markets" className="mt-7 inline-flex items-center rounded-xl bg-emerald-400 px-6 py-4 font-bold text-[#06110c] hover:bg-emerald-300">Explore the preview <ArrowRight className="ml-2" size={17}/></a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} MABXCHANGE. Demo build.</span>
          <span>Crypto assets are volatile. This demo does not provide financial services.</span>
        </div>
      </footer>
    </main>
  );
}
