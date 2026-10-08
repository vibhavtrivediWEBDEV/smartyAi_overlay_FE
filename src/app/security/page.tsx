import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Security and capture controls",
  description: "How SmartyAI handles desktop capture, local processing, saved sessions, permissions, and screen sharing across macOS and Windows.",
  alternates: { canonical: "/security" },
};

const dataRows = [
  ["Resume, job description, preferences", "Selected locally saved context uses Electron safeStorage. Resume and job description can also sync to the backend; relevant text can be sent for AI requests.", "Local and backend copies are separate. Backend retention and account-wide deletion require confirmation from the service operator."],
  ["One-shot screenshots and audio", "OCR and transcription use local helpers and temporary media files. Extracted or transcribed text can be sent to the backend for an AI answer.", "Temporary processing files are removed after normal helper completion; this is not a promise of cleanup after a crash."],
  ["Recording sessions", "Full recording sessions can save media segments, transcripts, and session events in the desktop app's local sessions folder.", "Stopping capture marks a session complete; it does not delete the saved session."],
  ["Account and AI requests", "Account data and submitted prompts reach the backend. The backend may pass request content to its configured AI provider.", "Backend backups, provider retention, and full account deletion are not specified here without a confirmed policy."],
];

const capabilities = [
  ["Microphone transcription", "Supported with permission", "Not advertised in the current Windows release"],
  ["System-audio transcription", "Supported with required access", "Supported when a usable audio track is available"],
  ["Screenshot OCR", "Apple Vision path", "Not advertised in the current Windows release"],
  ["Capture exclusion", "Best effort", "Best effort"],
  ["Screen-share verification", "Test your sharing mode", "Test your sharing mode"],
];

const checks = [
  "Open a private meeting in the Zoom, Meet, or Teams setup you intend to use.",
  "Choose the exact screen or window sharing mode you intend to use.",
  "Open SmartyAI and check its permission and capture indicators.",
  "Join from another device or account and inspect what that participant actually sees.",
  "With participant consent, test microphone and supported system-audio capture separately.",
  "Where supported, trigger screenshot OCR yourself and check the result.",
  "Stop capture and confirm its state is off before leaving the test meeting.",
];

export default function SecurityPage() {
  return (
    <main className="grain min-h-screen bg-ink text-paper">
      <SiteHeader />
      <section className="hero-grid border-b border-white/10 px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-300">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Security</p>
          <h1 className="display-type mt-5 max-w-4xl text-[clamp(3.2rem,7vw,6.8rem)] font-semibold leading-[.88]">Know what stays local. Know what leaves.</h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-[#aaa397] md:text-lg">SmartyAI uses OS-backed protections for selected local data and user-controlled desktop capture. AI requests can send context to a backend and provider. Screen-share exclusion is best effort, never guaranteed.</p>
          <a href="#setup-check" className="mt-8 inline-flex bg-gold px-5 py-3 text-sm font-bold text-black">Test your setup</a>
        </div>
      </section>

      <div className="mx-auto max-w-300 space-y-20 px-5 py-16 md:px-10 md:py-24">
        <section aria-labelledby="architecture-heading">
          <h2 id="architecture-heading" className="display-type text-3xl font-semibold md:text-4xl">Security architecture</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa397]">Desktop renderer windows use sandboxing and context isolation with Node integration disabled. Sensitive actions pass through a narrow preload bridge and validated main-process requests. Production AI provider credentials live on the backend, not in the desktop renderer.</p>
          <ol className="mt-8 grid gap-px border border-white/10 bg-white/10 text-sm font-bold sm:grid-cols-4">
            {["Desktop app", "Secure preload / IPC", "Backend API", "AI provider"].map((step, index) => <li key={step} className="bg-[#11110f] p-5"><span className="mr-3 text-gold">0{index + 1}</span>{step}</li>)}
          </ol>
          <p className="mt-4 text-xs leading-6 text-[#918a7e]">The diagram shows AI requests. Local OCR and transcription run in desktop helpers before extracted text may be sent for an answer.</p>
        </section>

        <section aria-labelledby="data-heading">
          <h2 id="data-heading" className="display-type text-3xl font-semibold md:text-4xl">Data handling</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa397]">Selected local context and grants use Electron safeStorage, backed by macOS Keychain or Windows DPAPI. This does not mean every file is encrypted or that synced data stays on-device.</p>
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="w-full min-w-180 border-collapse text-left text-sm leading-6">
              <thead className="bg-white/5 text-gold"><tr><th scope="col" className="p-4">Data</th><th scope="col" className="p-4">Processing and storage</th><th scope="col" className="p-4">Retention and deletion</th></tr></thead>
              <tbody>{dataRows.map(([type, handling, retention]) => <tr key={type} className="border-t border-white/10 align-top text-[#bbb4a9]"><th scope="row" className="p-4 font-semibold text-white">{type}</th><td className="p-4">{handling}</td><td className="p-4">{retention}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-6 text-[#918a7e]">Clear conversation removes the local conversation copy, not necessarily saved recording sessions or backend profile data. See the <Link href="/privacy" className="text-gold underline">privacy notice</Link> for service-policy boundaries.</p>
        </section>

        <section aria-labelledby="capture-heading">
          <h2 id="capture-heading" className="display-type text-3xl font-semibold md:text-4xl">Capture and screen share</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa397]">Desktop capture requires a user action and applicable consent. Recording sessions have start and stop controls; stopping a saved session is not the same as deleting it. Whether the overlay appears to others depends on your OS, meeting app, and chosen sharing mode. Test the participant view before an important call.</p>
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="w-full min-w-152.5 border-collapse text-left text-sm leading-6">
              <thead className="bg-white/5 text-gold"><tr><th scope="col" className="p-4">Capability</th><th scope="col" className="p-4">macOS</th><th scope="col" className="p-4">Windows</th></tr></thead>
              <tbody>{capabilities.map(([capability, macos, windows]) => <tr key={capability} className="border-t border-white/10 text-[#bbb4a9]"><th scope="row" className="p-4 font-semibold text-white">{capability}</th><td className="p-4">{macos}</td><td className="p-4">{windows}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-6 text-[#918a7e]">Capability depends on app version, permissions, available helpers, and the selected audio source. See <Link href="/macos" className="text-gold underline">macOS</Link> and <Link href="/windows" className="text-gold underline">Windows</Link> release details.</p>
        </section>

        <section aria-labelledby="permissions-heading">
          <h2 id="permissions-heading" className="display-type text-3xl font-semibold md:text-4xl">Permissions and failure states</h2>
          <dl className="mt-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              ["Microphone", "Needed to access your voice for supported transcription. If denied or revoked, microphone capture cannot continue; check OS settings and retry."],
              ["Screen Recording", "Needed for supported screenshot and display capture on macOS. A permission change may require restarting the app before retrying."],
              ["System audio", "Captures a supported system or shared-source audio track when you start it. If the OS, permission, or source supplies no track, transcription cannot start for that source."],
            ].map(([term, explanation]) => <div key={term} className="bg-[#11110f] p-6"><dt className="text-base font-bold text-white">{term}</dt><dd className="mt-3 text-sm leading-6 text-[#aaa397]">{explanation}</dd></div>)}
          </dl>
          <p className="mt-4 text-xs leading-6 text-[#918a7e]">If one capture source fails, do not assume every other source has stopped: use the app controls to check each state and stop the session explicitly.</p>
        </section>

        <section id="setup-check" aria-labelledby="check-heading" className="scroll-mt-20 border-y border-gold/30 py-10">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Before your interview</p>
          <h2 id="check-heading" className="display-type mt-4 text-3xl font-semibold md:text-4xl">Run a 60-second setup check</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">{checks.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-6 text-[#c8c2b8]"><span className="font-mono text-gold">0{index + 1}</span>{step}</li>)}</ol>
          <p className="mt-8 max-w-3xl text-sm leading-7 text-white">Test your exact setup before an important interview. A successful private test does not guarantee the same result after a software update or sharing-mode change.</p>
        </section>

        <section aria-labelledby="limits-heading">
          <h2 id="limits-heading" className="display-type text-3xl font-semibold md:text-4xl">What we do not guarantee</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa397]">No universal screen-share invisibility, identical behavior in all meeting apps, uninterrupted access after permission changes, or automatic deletion of saved recording sessions. Review meeting and workplace rules, obtain participant consent, and avoid sharing data you are not authorized to use.</p>
          <p className="mt-5 text-sm text-[#aaa397]">For release authenticity and published checksums see <Link href="/downloads" className="text-gold underline">downloads</Link>. For security questions or reports see <Link href="/contact" className="text-gold underline">contact</Link>; do not include active credentials or private interview content.</p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}