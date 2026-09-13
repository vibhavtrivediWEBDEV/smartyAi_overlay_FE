import type { Metadata } from "next";
import Link from "next/link";
import { Apple, ArrowRight, CheckCircle2, Download, Monitor, ShieldAlert, Terminal } from "lucide-react";
import { CopyCommand } from "@/components/copy-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { API_BASE_URL } from "@/lib/api";

export const metadata: Metadata = { title: "Download SmartyAI for Mac", description: "Download SmartyAI 1.0.7 for Apple Silicon Macs and follow the guided installation steps.", alternates: { canonical: "/downloads" } };

const fileName = "SmartyAI-1.0.7-mac-arm64-internal.dmg";
const downloadUrl = "https://smartyai-downloads-807857683817.s3.ap-southeast-2.amazonaws.com/SmartyAI-1.0.7-mac-arm64-internal.dmg";
const windowsFileName = "SmartyAI-Setup-1.0.7-x64.exe";
const windowsDownloadUrl = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || `${API_BASE_URL}/downloads/${encodeURIComponent(windowsFileName)}`;
const quarantineCommand = "xattr -dr com.apple.quarantine /Applications/SmartyAI.app";
const openCommand = "open /Applications/SmartyAI.app";

export default function DownloadsPage() {
  return (
    <main className="luxury-downloads min-h-screen bg-ink text-paper">
      <SiteHeader />
      <section className="luxury-downloads-hero hero-grid px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">SmartyAI for macOS</p>
          <h1 className="display-type mt-5 max-w-4xl text-6xl font-semibold leading-[.9] tracking-normal md:text-8xl">Your conversation copilot, ready for Mac.</h1>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-[#aaa397]">Download the latest Apple Silicon build, move SmartyAI to Applications, and finish setup in a few minutes.</p>
        </div>
      </section>

      <section className="luxury-downloads-body px-5 pb-24 md:px-10">
        <div className="luxury-downloads-grid mx-auto grid max-w-[1200px] gap-px border border-white/10 bg-white/10 lg:grid-cols-[1.1fr_.9fr]">
          <article className="luxury-download-card min-w-0 bg-[#11110f] p-8 md:p-10">
            <div className="flex items-center justify-between gap-4">
              <Apple size={26} className="text-gold" />
              <span className="border border-gold/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-gold">Latest build</span>
            </div>
            <h2 className="display-type mt-8 text-4xl font-semibold tracking-normal">SmartyAI 1.0.7</h2>
            <p className="mt-3 text-sm text-[#aaa397]">Apple Silicon (M1, M2, M3, M4 and newer) · macOS 13+ · 174 MB</p>
            <a href={downloadUrl} download={fileName} className="mt-8 flex w-full items-center justify-center gap-2 bg-gold px-5 py-4 text-sm font-bold text-black sm:w-fit">
              <Download size={17} />Download for Apple Silicon
            </a>
            <p className="mt-4 break-all text-[11px] text-[#777066]">{fileName}</p>
            <div className="mt-8 flex gap-3 border-t border-white/10 pt-6 text-xs leading-5 text-[#918a7e]">
              <ShieldAlert className="mt-0.5 shrink-0 text-gold" size={17} />
              <p>This test build is ad-hoc signed and not Apple notarized. Only continue if you downloaded it directly from SmartyAI.</p>
            </div>
          </article>

          <article className="min-w-0 bg-[#0d0d0b] p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Install in three steps</p>
            <ol className="mt-7 grid gap-6">
              <li className="flex gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} /><div><h3 className="text-sm font-bold">Open the DMG</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Drag SmartyAI into the Applications folder.</p></div></li>
              <li className="flex gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} /><div><h3 className="text-sm font-bold">Try the standard secure open</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">In Finder, Control-click SmartyAI, choose Open, then confirm Open.</p></div></li>
              <li className="flex gap-4"><Terminal className="mt-0.5 shrink-0 text-gold" size={18} /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">If macOS still blocks the app</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Open Terminal and run these commands:</p><CopyCommand command={quarantineCommand} /><CopyCommand command={openCommand} /></div></li>
            </ol>
          </article>
        </div>

        <div className="luxury-download-status mx-auto mt-8 flex max-w-[1200px] flex-col justify-between gap-4 border border-white/10 p-6 sm:flex-row sm:items-center">
          <div className="min-w-0"><h2 className="text-sm font-bold">Using an Intel Mac?</h2><p className="mt-2 text-xs leading-6 text-[#918a7e]">The current public download is built for Apple Silicon. Intel and Windows releases are still in validation.</p></div>
          <Link href="/macos" className="flex shrink-0 items-center gap-2 text-xs font-bold text-gold">View Mac requirements <ArrowRight size={14} /></Link>
        </div>

        <div className="mx-auto mt-8 grid max-w-[1200px] gap-px border border-white/10 bg-white/10 lg:grid-cols-[1.1fr_.9fr]">
          <article className="min-w-0 bg-[#11110f] p-8 md:p-10">
            <div className="flex items-center justify-between gap-4"><Monitor size={26} className="text-[#7ed5d7]" /><span className="border border-[#7ed5d7]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#7ed5d7]">Windows test build</span></div>
            <h2 className="display-type mt-8 text-4xl font-semibold tracking-normal">SmartyAI 1.0.7 for Windows</h2>
            <p className="mt-3 text-sm text-[#aaa397]">Windows 10/11 · x64 installer · system-audio transcription included</p>
            <a href={windowsDownloadUrl} download={windowsFileName} className="mt-8 flex w-full items-center justify-center gap-2 border border-[#7ed5d7]/40 bg-[#153638] px-5 py-4 text-sm font-bold text-white sm:w-fit"><Download size={17} />Download for Windows</a>
            <p className="mt-4 break-all text-[11px] text-[#777066]">{windowsFileName}</p>
          </article>
          <article className="min-w-0 bg-[#0d0d0b] p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#7ed5d7]">Windows installation</p>
            <ol className="mt-7 grid gap-6">
              <li className="flex gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-[#7ed5d7]" size={18} /><div><h3 className="text-sm font-bold">Run the installer</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Open the downloaded setup file and follow the installation prompts. No macOS quarantine command is needed.</p></div></li>
              <li className="flex gap-4"><ShieldAlert className="mt-0.5 shrink-0 text-[#7ed5d7]" size={18} /><div><h3 className="text-sm font-bold">If SmartScreen appears</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Only for a file downloaded directly from SmartyAI, choose More info, verify the filename, then select Run anyway. Do not disable Windows Security.</p></div></li>
              <li className="flex gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-[#7ed5d7]" size={18} /><div><h3 className="text-sm font-bold">Current Windows support</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Overlay, AI chat, encrypted context, and offline system-audio transcription are available. Microphone transcription and screenshot OCR are not yet available.</p></div></li>
            </ol>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}