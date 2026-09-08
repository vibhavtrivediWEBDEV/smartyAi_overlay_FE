import type { Metadata } from "next";
import { Apple, Download, Monitor } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { API_BASE_URL } from "@/lib/api";

export const metadata: Metadata = { title: "Downloads", description: "Download current SmartyAI desktop validation builds for macOS.", alternates: { canonical: "/downloads" } };

const builds = [
  { title: "macOS · Apple Silicon", detail: "macOS 13+ · arm64 · DMG", file: "SmartyAI-1.0.0-mac-arm64.dmg", icon: Apple },
  { title: "macOS · Intel", detail: "macOS 13+ · x64 · DMG", file: "SmartyAI-1.0.0-mac-x64.dmg", icon: Monitor },
];

export default function DownloadsPage() {
  return <main className="luxury-downloads min-h-screen bg-ink text-paper"><SiteHeader /><section className="luxury-downloads-hero hero-grid px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1200px]"><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Downloads</p><h1 className="display-type mt-5 max-w-4xl text-6xl font-semibold leading-[.9] tracking-normal md:text-8xl">Put the overlay where the conversation happens.</h1><p className="mt-7 max-w-2xl text-sm leading-7 text-[#aaa397]">Current repository artifacts are unsigned internal validation builds. Public distribution still requires final signing, notarization, branded icons, and clean-machine release testing.</p></div></section><section className="luxury-downloads-body px-5 pb-24 md:px-10"><div className="luxury-downloads-grid mx-auto grid max-w-[1200px] gap-px border border-white/10 bg-white/10 md:grid-cols-2">{builds.map(({ title, detail, file, icon: Icon }) => <article key={file} className="luxury-download-card bg-[#11110f] p-8 md:p-10"><Icon size={24} className="text-gold" /><h2 className="display-type mt-8 text-4xl font-semibold tracking-normal">{title}</h2><p className="mt-3 text-sm text-[#8f887d]">{detail}</p><a href={`${API_BASE_URL}/downloads/${encodeURIComponent(file)}`} className="mt-8 flex w-fit items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-black"><Download size={16} />Download DMG</a></article>)}</div><div className="luxury-download-status mx-auto mt-8 max-w-[1200px] border border-white/10 p-6"><h2 className="text-sm font-bold">Windows release status</h2><p className="mt-2 text-xs leading-6 text-[#918a7e]">The repository defines Windows 10/11 x64 packaging, but no final public Windows installer is exposed here. Windows system-audio capture and offline transcription are included; microphone transcription and OCR remain unavailable.</p></div></section><SiteFooter /></main>;
}