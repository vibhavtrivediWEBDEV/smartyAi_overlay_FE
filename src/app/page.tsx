import type { Metadata } from "next";
import Link from "next/link";
import {
  AudioLines,
  ArrowRight,
  Check,
  Code2,
  FileText,
  Gauge,
  Layers3,
  Mic,
  MonitorUp,
  MousePointer2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getPlans } from "@/lib/api";
import { ComparisonExplorer } from "@/components/comparison-explorer";
import { HomeExperience } from "@/components/home-experience";
import { FeatureStorySections } from "@/components/feature-story-sections";
import { LiveOverlayDemo } from "@/components/live-overlay-demo";
import { PricingPlans } from "@/components/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { marketingPages } from "@/content/pages";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const capabilities = [
  "Resume + JD grounded answers",
  "Multi-display overlay controls",
  "Local macOS transcription + OCR",
  "Encrypted local context",
];

const journey = [
  { icon: FileText, label: "01", title: "Bring the brief", body: "Add your resume and the role description so answers stay relevant to your actual experience." },
  { icon: AudioLines, label: "02", title: "Listen deliberately", body: "Start microphone or supported system-audio capture only when you choose. Recording state remains visible." },
  { icon: MousePointer2, label: "03", title: "Add visual context", body: "Trigger a screenshot when a prompt, diagram, or shared document needs more context." },
  { icon: Gauge, label: "04", title: "Watch the answer arrive", body: "Responses stream into a compact overlay with measured first-token and completion timing." },
  { icon: Code2, label: "05", title: "Read code cleanly", body: "Fenced code gets a dedicated viewer, language label, copy control, and horizontal scrolling." },
  { icon: Layers3, label: "06", title: "Keep improving", body: "Move from the live conversation into ATS-aware resume refinement without inventing experience." },
];

const faqs = [
  ["How does screen-share protection work?", "The overlay uses operating-system capture protection, stays out of the macOS Dock or Windows taskbar, and remains available while you scroll or switch desktop windows. It is designed to stay out of supported screen-share paths used by Zoom, Microsoft Teams, and Google Meet. Share modes and capture tools vary, so verify protection before an important meeting; no app can guarantee invisibility in every environment."],
  ["What works on macOS and Windows?", "macOS 13+ supports the bundled local Whisper, Apple Vision OCR, and ScreenCaptureKit paths. Windows supports typed chat plus system-audio capture and offline transcription; microphone transcription and screenshot OCR remain disabled."],
  ["Are job-application tools included at checkout?", "No. Job-application automation is on the roadmap and is not included in today's checkout. Choose a plan for the available interview and preparation tools, not for application automation."],
  ["Does the website record my system audio?", "Only after you choose a browser tab or screen source with audio. The browser workspace is a preview; real-time microphone and system-audio transcription are provided by the desktop app after permission is granted."],
  ["How is the five-action preview enforced?", "The backend hashes the client IP and stores a daily UTC usage record. Incognito mode, a different browser, or cleared cookies do not create another allowance. Shared networks may share one quota."],
  ["Can answers fabricate resume experience?", "The resume workflow validates generated numbers and skills against source material, protects contact details, and only presents ATS suggestions that improve the deterministic score."],
];

export default async function Home() {
  const plans = await getPlans();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SmartyAI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "macOS 13+, Windows 10/11 x64",
    url: SITE_URL,
    description:
      "A desktop conversation assistant with contextual AI chat, a multi-display overlay, and local macOS transcription and OCR.",
  };

  return (
    <HomeExperience>
    <main className="grain overflow-hidden bg-ink text-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section data-home-hero className="hero-grid home-hero relative min-h-[92svh] border-b border-white/10">
        <div className="home-hero-glow absolute inset-0" />
        <div data-hero-monogram className="home-hero-monogram" aria-hidden="true">S</div>
        <div className="home-hero-coordinate" aria-hidden="true">PRIVATE INTELLIGENCE / 01</div>
        <div className="relative z-10">
          <SiteHeader immersive />
        </div>

        <div className="relative z-1 mx-auto grid min-h-[calc(92svh-5rem)] max-w-[1540px] items-center gap-10 px-5 pb-12 pt-8 md:px-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-12 lg:pb-16">
          <div className="reveal min-w-0 max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#ffae55]">
              <Sparkles size={14} /> Private conversation intelligence
            </p>
            <h1 data-hero-title className="display-type text-[clamp(3.25rem,6.5vw,6.8rem)] font-semibold leading-[.84] tracking-normal text-white">
              SmartyAI.
              <br />
              <span className="italic text-[#ffae55]">Own the moment.</span>
            </h1>
            <p data-hero-copy className="mt-7 max-w-lg text-base leading-7 text-[#c8c2b8] md:text-lg">
              A desktop assistant for interviews and important conversations.
              Prepare approved answers in Response Studio, ground live guidance in
              your resume and job description, and control capture explicitly in a compact overlay.
            </p>
            <div data-hero-actions className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register?plan=trial"
                data-magnetic
                data-cursor-label="START"
                className="flex items-center gap-2 rounded-md bg-[#ffae55] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc47f]"
              >
                Start 1-day trial · ₹10 <ArrowRight size={16} />
              </Link>
              <Link

                href="#live-demo"
                data-magnetic
                data-cursor-label="EXPLORE"
                className="rounded-md border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:border-[#ffae55]"
              >
                Explore the workspace
              </Link>
            </div>
            <p data-hero-promo className="mt-3 text-xs font-semibold text-[#b9b1a4]">50 AI messages · one-time payment · no auto-renewal</p>
            <p data-hero-disclosure className="mt-5 text-xs leading-5 text-[#817b70]">
              The browser workspace uses typed questions and sample context. For real-time
              interview assistance, use the desktop app; capture requires permission and
              overlay exclusion varies by operating system and sharing app.
            </p>
            <div data-hero-proof className="home-hero-proof">
              <div><span>Response</span><strong>Measured live</strong><small>First-token + completion timing</small></div>
              <div><span>Context</span><strong>User approved</strong><small>Resume · JD · audio · screen</small></div>
              <div><span>Privacy</span><strong>Local-first tools</strong><small>Encrypted context · explicit capture</small></div>
            </div>
          </div>

          <div id="live-demo" data-hero-demo data-layout="vertical" data-cursor-label="TRY" className="relative min-w-0" aria-label="Interactive SmartyAI web preview">
            <div data-product-detail className="home-product-telemetry" aria-hidden="true">
              <span>Product / 01</span>
              <i />
              <span>Live</span>
            </div>
            <div data-product-detail className="home-product-axis" aria-hidden="true">
              <span>Vertical mode</span>
              <span>Horizontal mode</span>
            </div>
            <div data-product-detail className="home-product-index" aria-hidden="true">
              <span data-product-mode="vertical">V / 01</span>
              <span data-product-mode="horizontal">H / 02</span>
            </div>
            <i data-product-scan className="home-product-scan" aria-hidden="true" />
            <div className="home-overlay-window">
              <LiveOverlayDemo verticalToolbar />
            </div>
          </div>
        </div>
      </section>

      <section className="home-capability-band border-b border-white/10">
        <div data-reveal-group className="mx-auto grid max-w-360 grid-cols-2 md:grid-cols-4">
          {capabilities.map((item) => (
            <div
              key={item}
              className="home-capability-item flex min-h-20 items-center gap-3 px-5 text-xs font-bold uppercase tracking-[.08em] md:px-8"
            >
              <Check size={15} />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="home-journey-section px-5 py-24 md:px-10 md:py-32">
        <div data-journey-stage className="relative z-1 mx-auto max-w-360">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="home-section-kicker text-xs font-bold uppercase tracking-[.16em]">One continuous workflow</p>
              <h2 className="display-type mt-4 text-5xl font-semibold leading-[.95] tracking-normal md:text-7xl">From the brief to the live answer.</h2>
            </div>
            <p className="home-journey-copy max-w-2xl text-base leading-7 lg:justify-self-end">SmartyAI is built around the moments before, during, and after a consequential conversation. Each input is explicit, each answer stays visible in one compact workspace, and every capture can be stopped by the user.</p>
          </div>
          <div className="home-journey-viewport">
          <div className="home-journey-grid home-journey-track mt-14">
            {journey.map(({ icon: Icon, label, title, body }) => <article data-journey-card key={label} className="home-journey-card min-h-64 p-6 md:p-8">
              <div className="flex items-center justify-between"><span className="font-mono text-xs">{label}</span><Icon size={21} /></div>
              <h3 className="display-type mt-12 text-2xl font-semibold tracking-normal">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6">{body}</p>
            </article>)}
          </div></div>
        </div>
      </section>

      <FeatureStorySections sections={marketingPages.features.sections} home />

      <section data-code-section className="home-code-section border-y border-white/10 bg-[#0b0c0d] px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-360">
          <div className="grid gap-12 lg:grid-cols-2">
            <div data-reveal>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Technical conversations</p>
              <h2 className="display-type mt-4 text-5xl font-semibold leading-none tracking-normal">Code without losing the question.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#aaa397]">Keep the discussion, constraints, and response together. The overlay renders code separately from prose, preserves long lines with internal scrolling, and offers a copy action without widening the window.</p>
              <div className="mt-9 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                {["System design follow-ups", "Behavioral story structure", "JavaScript and backend code", "Resume-grounded examples"].map((item) => <div key={item} className="flex items-center gap-3 bg-[#111210] p-4 text-sm text-[#ddd7cc]"><Check size={15} className="text-[#63e6a4]" />{item}</div>)}
              </div>
            </div>
            <div data-code-panel className="self-end border border-white/10 bg-[#070809] p-3">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-mono text-[11px] text-white/45"><span>javascript</span><span>Copy</span></div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-[#b9d7ff]"><code>{`async function answer(context, question) {\n  const evidence = selectRelevantExperience(context);\n  return streamGroundedResponse({ question, evidence });\n}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section className="home-consent-section mx-auto max-w-360 px-5 py-24 md:px-10 md:py-32">
        <div data-reveal className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">
              Designed around consent
            </p>
            <h2 className="display-type mt-4 max-w-xl text-5xl font-semibold leading-[.95] tracking-normal md:text-7xl">
              Power when you ask for it. Quiet when you do not.
            </h2>
          </div>
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              {
                icon: MonitorUp,
                title: "Flexible overlay",
                body: "Dock, resize, adjust opacity, and move across displays.",
              },
              {
                icon: Mic,
                title: "Local on macOS",
                body: "Bundled Whisper, Apple Vision OCR, and ScreenCaptureKit on macOS 13+.",
              },
              {
                icon: ShieldCheck,
                title: "Explicit control",
                body: "Sensitive desktop actions require capability grants and validated requests.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <article key={title} className="bg-[#11110f] p-6 md:p-8">
                <Icon className="text-gold" size={22} />
                <h3 className="mt-8 text-sm font-bold text-[#fffaf0]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#918a7e]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ComparisonExplorer />

      <section id="pricing" className="home-pricing-section border-y border-white/10 px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-360">
          <div data-reveal className="home-pricing-heading">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">
                Plans from the SmartyAI service
              </p>
              <h2 className="display-type mt-4 max-w-3xl text-5xl font-semibold leading-[.92] tracking-normal md:text-7xl">
                Core tools now. Roadmap clearly marked.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#aaa397]">Compare what works today, what each action costs, and what is still coming. Choose the access period and AI-credit allowance that fits your next conversation.</p>
            </div>
            <Link
              href="/pricing"
              data-magnetic
              className="home-pricing-details-link"
            >
              Compare plan details <ArrowRight size={15} />
            </Link>
          </div>
          <PricingPlans plans={plans} />
        </div>
      </section>

      <section className="home-faq-section px-5 py-24 md:px-10 md:py-32">
        <div data-reveal className="relative z-1 mx-auto grid max-w-360 gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="home-section-kicker text-xs font-bold uppercase tracking-[.16em]">Straight answers</p>
            <h2 className="display-type mt-4 text-5xl font-semibold leading-none tracking-normal md:text-7xl">Privacy, limits, and platform truth.</h2>
          </div>
          <div className="home-faq-list">
            {faqs.map(([question, answer]) => <details key={question} className="home-faq-item group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold"><span>{question}</span><span className="text-xl font-normal group-open:rotate-45">+</span></summary>
              <p className="mt-4 max-w-2xl text-sm leading-6">{answer}</p>
            </details>)}
          </div>
        </div>
      </section>

      <section className="home-final-cta border-t border-white/10 px-5 py-24 md:px-10 md:py-32">
        <div data-reveal className="mx-auto flex max-w-360 flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="display-type max-w-4xl text-5xl font-semibold leading-[.95] tracking-normal md:text-7xl">Prepare with context. Stay present in the conversation.</h2>
          <Link href="/downloads" data-magnetic data-cursor-label="DOWNLOAD" className="flex w-fit items-center gap-2 rounded-md bg-[#ffae55] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#ffc47f]">Download SmartyAI <ArrowRight size={16} /></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
    </HomeExperience>
  );
}
