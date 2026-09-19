import type { Metadata } from "next";
import Link from "next/link";
import { Apple, ArrowLeftRight, ArrowRight, Camera, CheckCircle2, Download, EyeOff, Keyboard, Mic, Monitor, RefreshCw, ShieldAlert, Terminal, Volume2 } from "lucide-react";
import { CopyCommand } from "@/components/copy-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { API_BASE_URL } from "@/lib/api";

export const metadata: Metadata = { title: "Download SmartyAI for Mac", description: "Download SmartyAI 1.0.7 for Apple Silicon Macs and follow the guided installation steps.", alternates: { canonical: "/downloads" } };

const fileName = "SmartyAI-1.0.7-mac-arm64-internal.dmg";
const downloadUrl = "https://smartyai-downloads-807857683817.s3.ap-southeast-2.amazonaws.com/SmartyAI-1.0.9-mac-arm64-internal.dmg";
const windowsFileName = "SmartyAI-Setup-1.0.7-x64.exe";
const windowsDownloadUrl = `https://smartyai-downloads-807857683817.s3.ap-southeast-2.amazonaws.com/SmartyAI-Setup-1.0.9-x64.exe`;
const quarantineCommand = "xattr -dr com.apple.quarantine /Applications/SmartyAI.app";
const openCommand = "open /Applications/SmartyAI.app";

const quickActions = [
  { icon: EyeOff, title: "Hide or show SmartyAI", detail: "Use this anytime without leaving your meeting.", shortcut: "⌘ Option X" },
  { icon: ArrowLeftRight, title: "Move the overlay", detail: "Place it on the left or right side of your active display.", shortcut: "⌘ Option ← / →" },
  { icon: Camera, title: "Capture the question", detail: "Take a screenshot and let SmartyAI read the visible prompt.", shortcut: "⌘ Option S" },
  { icon: Mic, title: "Listen to your microphone", detail: "Start or stop microphone transcription.", shortcut: "⌘ Option ⇧ M" },
  { icon: Volume2, title: "Listen to the speaker", detail: "Start or stop system-audio transcription.", shortcut: "⌘ Option ⇧ A" },
  { icon: RefreshCw, title: "Regenerate the answer", detail: "Ask SmartyAI for a fresh response to the latest question.", shortcut: "⌘ Option ⇧ R" },
] as const;

const shortcuts = [
  ["Hide / show overlay", "⌘ Option X"],
  ["Move overlay left", "⌘ Option ←"],
  ["Move overlay right", "⌘ Option →"],
  ["Capture screenshot", "⌘ Option S"],
  ["Toggle microphone", "⌘ Option ⇧ M"],
  ["Toggle system audio", "⌘ Option ⇧ A"],
  ["Regenerate answer", "⌘ Option ⇧ R"],
  ["Show / hide conversation", "⌘ Option ⇧ H"],
  ["Increase opacity", "⌘ Option ⇧ ↑"],
  ["Decrease opacity", "⌘ Option ⇧ ↓"],
  ["Compact overlay", "⌘ Option −"],
  ["Expand overlay", "⌘ Option ="],
  ["Open profile context", "⌘ Option ⇧ P"],
  ["Open settings", "⌘ Option ⇧ K"],
  ["Clear conversation", "⌘ Option ⇧ Delete"],
] as const;

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
            <ol className="mt-7 grid min-w-0 gap-6">
              <li className="flex min-w-0 gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} /><div className="min-w-0"><h3 className="text-sm font-bold">Open the DMG</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Drag SmartyAI into the Applications folder.</p></div></li>
              <li className="flex min-w-0 gap-4"><CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} /><div className="min-w-0"><h3 className="text-sm font-bold">Try the standard secure open</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">In Finder, Control-click SmartyAI, choose Open, then confirm Open.</p></div></li>
              <li className="flex min-w-0 gap-4"><Terminal className="mt-0.5 shrink-0 text-gold" size={18} /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">If macOS still blocks the app</h3><p className="mt-1 text-xs leading-5 text-[#918a7e]">Open Terminal and run these commands:</p><CopyCommand command={quarantineCommand} /><CopyCommand command={openCommand} /></div></li>
            </ol>
          </article>
        </div>

        <div className="luxury-download-status mx-auto mt-8 flex max-w-[1200px] flex-col justify-between gap-4 border border-white/10 p-6 sm:flex-row sm:items-center">
          <div className="min-w-0"><h2 className="text-sm font-bold">Using an Intel Mac?</h2><p className="mt-2 text-xs leading-6 text-[#918a7e]">The current public download is built for Apple Silicon. Intel and Windows releases are still in validation.</p></div>
          <Link href="/macos" className="flex shrink-0 items-center gap-2 text-xs font-bold text-gold">View Mac requirements <ArrowRight size={14} /></Link>
        </div>

        <section className="mx-auto mt-16 max-w-300 border-y border-white/10 py-10 md:py-14" aria-labelledby="quick-use-heading">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-gold"><Keyboard size={16} />Quick use</p>
              <h2 id="quick-use-heading" className="display-type mt-4 max-w-2xl text-4xl font-semibold tracking-normal md:text-5xl">Stay in the conversation. Control everything from the keyboard.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#aaa397]">Open SmartyAI before your call and grant only the capture permissions you need. These shortcuts work globally while the desktop app is running.</p>
            </div>
            <div className="shrink-0 border border-gold/30 bg-gold/10 p-5 md:min-w-72">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Always hide / show the UI</p>
              <kbd className="mt-3 block font-mono text-xl font-bold text-white">⌘ Option X</kbd>
            </div>
          </div>

          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map(({ icon: Icon, title, detail, shortcut }) => (
              <div key={title} className="min-w-0 bg-[#0d0d0b] p-6">
                <Icon size={19} className="text-gold" />
                <h3 className="mt-5 text-sm font-bold">{title}</h3>
                <p className="mt-2 min-h-10 text-xs leading-5 text-[#918a7e]">{detail}</p>
                <kbd className="mt-5 block w-fit border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs font-bold text-[#f3d99b]">{shortcut}</kbd>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <h3 className="text-sm font-bold">How to use it fast</h3>
              <ol className="mt-5 grid gap-4 text-xs leading-6 text-[#aaa397]">
                <li><span className="mr-3 font-bold text-gold">01</span>Start SmartyAI before joining the conversation.</li>
                <li><span className="mr-3 font-bold text-gold">02</span>Add your resume and job context for relevant answers.</li>
                <li><span className="mr-3 font-bold text-gold">03</span>Use microphone for your voice or system audio for the other speaker.</li>
                <li><span className="mr-3 font-bold text-gold">04</span>Use screenshot capture when a question or code is visible on screen.</li>
                <li><span className="mr-3 font-bold text-gold">05</span>Press <kbd className="font-mono font-bold text-white">⌘ Option X</kbd> whenever you need to hide or restore the overlay.</li>
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-bold">All macOS shortcuts</h3>
              <div className="mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                {shortcuts.map(([label, shortcut]) => (
                  <div key={label} className="flex min-w-0 items-center justify-between gap-4 bg-[#11110f] px-4 py-3">
                    <span className="text-xs text-[#aaa397]">{label}</span>
                    <kbd className="shrink-0 font-mono text-[11px] font-bold text-white">{shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-8 text-[11px] leading-5 text-[#777066]">Screenshot and audio actions require the relevant macOS permission. Capture protection is best effort and depends on macOS and the screen-sharing app.</p>
        </section>

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