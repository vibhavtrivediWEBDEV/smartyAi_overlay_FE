import Link from "next/link";

const groups = [
  { title: "Product", links: [["Features", "/features"], ["Response Studio", "/features#response-studio"], ["Pricing", "/pricing"], ["Downloads", "/downloads"], ["Security", "/security"]] },
  { title: "Platforms", links: [["macOS", "/macos"], ["Windows", "/windows"], ["Interview use case", "/use-cases/interviews"]] },
  { title: "Company", links: [["FAQ", "/faq"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export function SiteFooter() {
  return (
    <footer className="luxury-site-footer border-t border-white/10 bg-[#080807] px-5 py-14 text-paper md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1.5fr_2fr]">
        <div><Link href="/" className="display-type text-3xl font-bold">Smarty<span className="text-gold">AI</span></Link><p className="mt-4 max-w-sm text-sm leading-6 text-[#8f887d]">Real-time interview assistance in a focused desktop workspace, with controls for your context and capture tools.</p></div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => <div key={group.title}><p className="text-xs font-bold uppercase tracking-[.14em] text-gold">{group.title}</p><div className="mt-4 grid gap-3">{group.links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-[#9f988c] hover:text-white">{label}</Link>)}</div></div>)}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1440px] flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#69645b] sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} SmartyAI.</p><p>Use capture only with permission. Capture exclusion is not guaranteed.</p></div>
    </footer>
  );
}