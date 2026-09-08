export type MarketingPage = {
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  sections: { title: string; body: string; bullets?: string[] }[];
};

export const marketingPages: Record<string, MarketingPage> = {
  features: {
    title: "A calmer way to think in real time.", eyebrow: "Product demo", description: "Explore a non-production demonstration of SmartyAI's intended desktop workflows.", intro: "This interactive demo illustrates a compact conversation overlay. It does not promise that every shown capability is available, production-ready, or suitable for sensitive data.",
    sections: [
      { title: "Context that earns its space", body: "The demo illustrates how sample resume and job-description context could shape answers. Resume upload and automatic context synchronization are disabled.", bullets: ["Context-aware chat concept", "Compact response preview", "Sample resume and role context"] },
      { title: "An overlay made for work", body: "Move between displays, choose a docking side, resize the window, adjust opacity, and keep keyboard access close.", bullets: ["Multi-display placement", "Docking and opacity controls", "Always-on-top modes"] },
      { title: "Native macOS capture", body: "On macOS 13+, bundled Whisper handles microphone transcription, Apple Vision handles screenshot OCR, and ScreenCaptureKit supports system audio.", bullets: ["Local transcription", "Screenshot text extraction", "Explicit permission prompts"] },
    ],
  },
  security: {
    title: "Sensitive context deserves boundaries.", eyebrow: "Demo security notes", description: "Design goals shown by this demo, not a certification or production security guarantee.", intro: "Do not enter sensitive data in this demo. The items below describe intended architecture and must be independently verified for any production release.",
    sections: [
      { title: "Encrypted local data", body: "Profile context, job descriptions, access tokens, and durable grants use Electron safeStorage, backed by macOS Keychain or Windows DPAPI." },
      { title: "Renderer isolation", body: "Desktop renderer pages run sandboxed with context isolation and Node integration disabled. Narrow preload APIs validate sensitive IPC requests." },
      { title: "Server-side providers", body: "Production provider credentials belong in the Express service, not this frontend or packaged renderer assets." },
      { title: "Honest capture protection", body: "SmartyAI can request capture exclusion, but behavior depends on the operating system and the application doing the capture. It cannot guarantee invisibility." },
    ],
  },
  macos: {
    title: "Native context tools for macOS 13+.", eyebrow: "macOS support", description: "SmartyAI support for Whisper transcription, Apple Vision OCR, ScreenCaptureKit system audio, and desktop overlays on macOS 13+.", intro: "The macOS build contains the broadest local capture toolset in the current release. Permissions are requested from onboarding or a direct user action.",
    sections: [
      { title: "Included locally", body: "Bundled universal helpers support Intel and Apple Silicon Macs.", bullets: ["Offline Whisper microphone transcription", "Apple Vision screenshot OCR", "ScreenCaptureKit system-audio PCM capture", "Multi-display overlay and AI chat"] },
      { title: "Permissions stay visible", body: "Microphone and Screen Recording access must be granted in macOS settings. A restart may be required after Screen Recording permission changes." },
      { title: "Release requirements", body: "Public distribution depends on signed and notarized release artifacts. Internal unsigned builds are intended for validation only." },
    ],
  },
  windows: {
    title: "Core overlay support, with clear limits.", eyebrow: "Windows support", description: "Current SmartyAI support and explicit limitations for Windows 10/11 x64.", intro: "Windows 10/11 x64 supports the Electron overlay, AI chat, encrypted local profile and grants, and capability-gated desktop actions.",
    sections: [
      { title: "Available now", body: "Use contextual AI chat and offline system-audio transcription in the multi-display overlay, with local data protected by Electron safeStorage and Windows DPAPI.", bullets: ["Overlay and AI chat", "Chromium/WASAPI loopback capture", "Bundled offline Whisper transcription", "Encrypted local context"] },
      { title: "Not available yet", body: "Windows microphone transcription and screenshot OCR do not have providers in this repository.", bullets: ["No Windows microphone transcription", "No Windows OCR"] },
      { title: "Capture behavior varies", body: "Best-effort capture exclusion depends on Windows and the capture application. SmartyAI does not promise undetectability." },
    ],
  },
  faq: {
    title: "Direct answers, no fine-print surprises.", eyebrow: "FAQ", description: "Frequently asked questions about SmartyAI desktop support, privacy, context, capture, and billing.", intro: "The short version: SmartyAI is a desktop assistant, macOS has the fullest native capture support, and plans use one-time Razorpay payments.",
    sections: [
      { title: "Is SmartyAI invisible on screen shares?", body: "No guarantee is possible. The desktop app uses best-effort capture exclusion, but results depend on the OS and the capture application." },
      { title: "Should I upload a real resume or job description?", body: "No. Use non-sensitive sample data only. Desktop resume extraction and automatic profile synchronization are disabled in this demo." },
      { title: "Does Windows support transcription or OCR?", body: "Windows supports offline transcription of captured system audio. Microphone transcription and screenshot OCR are not available yet." },
      { title: "Does checkout auto-renew?", body: "No. Plan purchases are one-time Razorpay payments. Access ends after the selected duration unless you purchase again." },
      { title: "Where do AI provider keys live?", body: "Provider credentials stay in the server environment and are not shipped in frontend assets." },
    ],
  },
  contact: {
    title: "Talk to the people building it.", eyebrow: "Contact", description: "Contact SmartyAI for product support, security questions, and release access.", intro: "For account, release, or security questions, contact the team through the support channel configured by your SmartyAI distributor.",
    sections: [{ title: "What to include", body: "Share your platform, app version, the workflow you were using, and any non-sensitive error text. Never send passwords, JWTs, API keys, resumes, or private conversation content." }, { title: "Security reports", body: "Describe the affected component and reproduction steps without including active credentials or personal data." }],
  },
  privacy: {
    title: "Privacy starts with accurate boundaries.", eyebrow: "Demo privacy notice", description: "This demo is not approved for resumes, private conversations, credentials, or other sensitive information.", intro: "Resume extraction uploads are disabled in the desktop demo, and profile or job-description files are not automatically synchronized by it.",
    sections: [{ title: "What not to submit", body: "Do not enter real resumes, job descriptions, credentials, private conversations, or personal data into this demo." }, { title: "Demo service data", body: "Interactive chat and account actions may contact the configured demo backend. Treat all submitted content as non-sensitive test data." }, { title: "Desktop files", body: "Profile and job-description saves in the desktop demo remain local. Resume upload and extraction are disabled." }, { title: "Before production", body: "A production release needs verified controls and published retention, deletion, subprocessors, contact details, and jurisdiction terms." }],
  },
  terms: {
    title: "Terms that match the product today.", eyebrow: "Terms", description: "Current service terms foundation for SmartyAI development and pre-release access.", intro: "SmartyAI is currently offered as development or pre-release software unless your distributor provides separate signed terms.",
    sections: [{ title: "Appropriate use", body: "Use SmartyAI only where assistance and recording are permitted. You are responsible for consent, workplace rules, and applicable law." }, { title: "No guaranteed invisibility", body: "Capture exclusion is best effort. Do not rely on the product to be hidden from screen-sharing or monitoring software." }, { title: "Service availability", body: "Features may depend on platform permissions, native runtime availability, backend configuration, and third-party providers." }, { title: "Payments", body: "Plan access is activated after the backend verifies a one-time Razorpay payment. Purchases do not renew automatically." }],
  },
};

export const seoPages: Record<string, MarketingPage> = {
  "use-cases/interviews": { title: "Interview support that keeps you in the conversation.", eyebrow: "Use case", description: "Use resume and job-description context with a compact SmartyAI desktop overlay during interview preparation and important conversations.", intro: "Prepare your context in the desktop app, listen actively, and use suggestions as a structure for your own truthful experience.", sections: [{ title: "Before the conversation", body: "Add resume and job-description context locally, choose the display and overlay position, and grant only the capabilities you need." }, { title: "In the moment", body: "On macOS 13+, local transcription and screenshot OCR can provide context after explicit user actions. Windows supports typed context, system-audio capture, and offline transcription." }, { title: "Your experience stays yours", body: "Suggestions should help organize real examples, not fabricate credentials, achievements, or experience." }] },
    "alternatives/interview-assistants": { title: "Compare conversation assistants by their boundaries.", eyebrow: "Demo comparison", description: "A demonstration of criteria for comparing interview assistants; verify every product claim with its publisher.", intro: "This page is illustrative, not an independently verified product comparison. Check current vendor documentation before making a decision.", sections: [{ title: "Ask where data lives", body: "Use only non-sensitive sample data in this demo. Resume extraction and automatic profile synchronization are disabled." }, { title: "Check platform parity", body: "Windows supports offline system-audio transcription but not microphone transcription or OCR." }, { title: "Reject absolute stealth claims", body: "Capture exclusion varies by operating system and capture tool and must not be treated as guaranteed invisibility." }] },
  "company/about": { title: "Software for staying thoughtful under pressure.", eyebrow: "About SmartyAI", description: "Learn the product principles behind SmartyAI's desktop conversation assistant.", intro: "SmartyAI is designed around a simple premise: real-time assistance should increase clarity without erasing consent, platform truth, or the user's own judgment.", sections: [{ title: "Build for the live moment", body: "Stable controls, readable answers, predictable shortcuts, and recoverable errors matter more than decorative novelty." }, { title: "Name the limits", body: "Platform gaps and capture uncertainty belong in product copy, not buried in release notes." }, { title: "Keep privilege narrow", body: "Desktop operations remain behind validated IPC, capability grants, and explicit user actions." }] },
};