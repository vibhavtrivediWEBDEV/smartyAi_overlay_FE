export const comparisonProducts = [
  {
    id: "smartyai",
    name: "SmartyAI",
    label: "Our product",
    category: "Desktop conversation workspace",
    sourceHref: "/features",
  },
  {
    id: "final-round",
    name: "Final Round AI",
    label: "Interview copilot",
    category: "Prepare · perform · review",
    sourceHref: "https://www.finalroundai.com/live-interview",
  },
  {
    id: "interviewlift",
    name: "InterviewLift",
    label: "Interview copilot",
    category: "Jarvis · coaching · career tools",
    sourceHref: "https://www.interviewlift.com/interview-copilot",
  },
  {
    id: "chiku",
    name: "Chiku AI",
    label: "Interview assistant",
    category: "Live answers · resume tools",
    sourceHref: "https://www.chiku-ai.in/",
  },
  {
    id: "parakeet",
    name: "ParakeetAI",
    label: "Call assistant",
    category: "Live answers · notes · prep tools",
    sourceHref: "https://www.parakeet-ai.com/",
  },
  {
    id: "cluely",
    name: "Cluely",
    label: "Meeting assistant",
    category: "Answers · meeting notes",
    sourceHref: "https://cluely.com/",
  },
] as const;

export type ComparisonProductId = (typeof comparisonProducts)[number]["id"];

export const comparisonRows = [
  {
    id: "live-workflow",
    group: "workflow",
    label: "How live help arrives",
    facts: {
      smartyai: { text: "AI answers stream into the desktop overlay. The live preview reports first-token and full-response timing; approved library answers can be opened directly without a generation request.", source: "/#live-demo", evidence: "Current product" },
      "final-round": { text: "Copilot listens during a live call and streams answer prompts shaped by the active Goal and materials.", source: "https://www.finalroundai.com/live-interview", evidence: "Product page" },
      interviewlift: { text: "Jarvis listens to interview audio and presents silent, in-app answer guidance.", source: "https://www.interviewlift.com/interview-copilot", evidence: "Product page" },
      chiku: { text: "The site describes live transcription and real-time answer suggestions for interviews.", source: "https://www.chiku-ai.in/", evidence: "Product page" },
      parakeet: { text: "The site describes automatic question detection and suggested answers during calls.", source: "https://www.parakeet-ai.com/", evidence: "Product page" },
      cluely: { text: "The site describes live conversation context and an on-demand Assist action, alongside meeting notes.", source: "https://cluely.com/", evidence: "Product page" },
    },
  },
  {
    id: "prepared-context",
    group: "context",
    label: "Prepared context",
    facts: {
      smartyai: { text: "Resume, job description, profile preferences, and user-approved examples. Saved answers remain editable and user-controlled.", source: "/dashboard/response-studio", evidence: "Response Studio" },
      "final-round": { text: "A Goal can include the role, resume, job description, and preparation materials.", source: "https://www.finalroundai.com/live-interview", evidence: "Product page" },
      interviewlift: { text: "The site describes job-description-tuned answers and a resume-to-role workflow.", source: "https://www.interviewlift.com/interview-copilot", evidence: "Product page" },
      chiku: { text: "The site lists CV uploads and resume tools; detailed live-answer context limits are not stated on the cited pages.", source: "https://www.chiku-ai.in/pricing", evidence: "Pricing page" },
      parakeet: { text: "Users can add a CV, documents, and session instructions; the FAQ says these can be used during a call.", source: "https://www.parakeet-ai.com/", evidence: "Product FAQ" },
      cluely: { text: "The Starter plan lists custom instructions and file uploads; the product also describes screen and conversation context.", source: "https://cluely.com/pricing", evidence: "Pricing page" },
    },
  },
  {
    id: "beyond-live",
    group: "workflow",
    label: "Beyond the live moment",
    facts: {
      smartyai: { text: "Response Studio for answer preferences and examples, plus resume tools. Scope depends on the selected plan.", source: "/features", evidence: "Current product" },
      "final-round": { text: "The homepage presents practice interviews and post-session debriefs alongside live Copilot.", source: "https://www.finalroundai.com/", evidence: "Product page" },
      interviewlift: { text: "The site bundles AI resume tools, interview question preparation, and access to a human coach on eligible plans.", source: "https://www.interviewlift.com/", evidence: "Product page" },
      chiku: { text: "The pricing page lists resume tools, job recommendations, and transcript storage with paid plans.", source: "https://www.chiku-ai.in/pricing", evidence: "Pricing page" },
      parakeet: { text: "The site lists AI notes, mock interviews, a question bank, and resume tools.", source: "https://www.parakeet-ai.com/", evidence: "Product page" },
      cluely: { text: "The site presents meeting notes and searchable meeting history in addition to live Assist.", source: "https://cluely.com/", evidence: "Product page" },
    },
  },
  {
    id: "platforms",
    group: "platforms",
    label: "Published platform support",
    facts: {
      smartyai: { text: "macOS 13+ and Windows 10/11 x64, with different capture capabilities by OS. See the platform notes before installing.", source: "/macos", evidence: "Current support notes" },
      "final-round": { text: "The live-interview page lists macOS and Windows. Its product page names Zoom, Meet, Teams, Webex, HackerRank, and CoderPad, among others.", source: "https://www.finalroundai.com/live-interview", evidence: "Product page" },
      interviewlift: { text: "The site offers Mac and Windows downloads and lists meeting and coding-platform pages, including Zoom, Teams, Meet, HackerRank, CoderPad, and CodeSignal.", source: "https://www.interviewlift.com/interview-copilot", evidence: "Product page" },
      chiku: { text: "The homepage lists Zoom, Google Meet, Microsoft Teams, HackerRank, and LeetCode.", source: "https://www.chiku-ai.in/", evidence: "Product page" },
      parakeet: { text: "The FAQ lists Windows and macOS desktop apps; live browser sessions require desktop Chrome. Mobile use is web-based.", source: "https://www.parakeet-ai.com/", evidence: "Product FAQ" },
      cluely: { text: "The current download page offers a Mac app. The homepage names Zoom, Slack, Webex, Teams, and Google Meet as compatible tools.", source: "https://cluely.com/", evidence: "Product page" },
    },
  },
  {
    id: "languages",
    group: "platforms",
    label: "Published language support",
    facts: {
      smartyai: { text: "The web preview currently offers English, Hindi, and Spanish. Desktop transcription options depend on platform and provider.", source: "/features", evidence: "Current product" },
      "final-round": { text: "The homepage advertises support for 143 languages and accents.", source: "https://www.finalroundai.com/", evidence: "Vendor-published" },
      interviewlift: { text: "The homepage advertises 50+ languages.", source: "https://www.interviewlift.com/", evidence: "Vendor-published" },
      chiku: { text: "The homepage advertises real-time transcription in 52+ languages.", source: "https://www.chiku-ai.in/", evidence: "Vendor-published" },
      parakeet: { text: "The FAQ says 50+ languages, with one recognition language selected at a time.", source: "https://www.parakeet-ai.com/", evidence: "Product FAQ" },
      cluely: { text: "The homepage says the transcription feature supports 12+ languages.", source: "https://cluely.com/", evidence: "Vendor-published" },
    },
  },
  {
    id: "timing",
    group: "timing",
    label: "Published timing language",
    facts: {
      smartyai: { text: "The live preview measures first-token and completed-response time on your connection. It is not a standardized vendor benchmark.", source: "/#live-demo", evidence: "Measured in preview" },
      "final-round": { text: "The live page says prompts appear seconds after a question; a precise method or test setup is not published there.", source: "https://www.finalroundai.com/live-interview", evidence: "Vendor wording" },
      interviewlift: { text: "Official pages differ: the FAQ says about 700 ms on Zoom and under 1 s on Meet; the pricing page also advertises about 150 ms. Not independently tested or directly comparable.", source: "https://www.interviewlift.com/interview-copilot", evidence: "Different page claims" },
      chiku: { text: "The site says real-time, but the cited product and pricing pages do not define a numeric answer-latency method.", source: "https://www.chiku-ai.in/", evidence: "No comparable figure stated" },
      parakeet: { text: "The cited homepage describes transcription as fast but does not give a numeric end-to-end answer-latency method.", source: "https://www.parakeet-ai.com/", evidence: "No comparable figure stated" },
      cluely: { text: "The homepage lists 300 ms under real-time transcription. It does not define that as end-to-end answer-generation latency.", source: "https://cluely.com/", evidence: "Transcription claim" },
    },
  },
  {
    id: "pricing",
    group: "pricing",
    label: "Public entry pricing",
    facts: {
      smartyai: { text: "Current SmartyAI plans and included usage are listed below; checkout is one-time, without automatic renewal.", source: "#pricing", evidence: "Current plans" },
      "final-round": { text: "Free plan listed; Pro starts at $25+/month for live Copilot.", source: "https://www.finalroundai.com/subscription-simple", evidence: "Pricing page" },
      interviewlift: { text: "Silver is listed at ₹24,000 + 18% GST for 90 days; one-round packs are also offered. Price is shown in INR.", source: "https://www.interviewlift.com/pricing", evidence: "Pricing page · INR" },
      chiku: { text: "Standard is listed from ₹1,199 + 18% GST for 3 hours; a promotional code was displayed when checked. Price is shown in INR.", source: "https://www.chiku-ai.in/pricing", evidence: "Pricing page · INR" },
      parakeet: { text: "The homepage lists ₹4,980/week and ₹9,470/month for Unlimited. Price is shown in INR.", source: "https://www.parakeet-ai.com/#pricing", evidence: "Pricing page · INR" },
      cluely: { text: "Starter is free; Pro is $19.99/month; Pro + Undetectability is $149.99/month.", source: "https://cluely.com/pricing", evidence: "Pricing page" },
    },
  },
  {
    id: "capture-claims",
    group: "capture",
    label: "Screen-share statement",
    facts: {
      smartyai: { text: "Capture exclusion is best effort and varies by operating system and capture app. We do not promise invisibility; verify your setup.", source: "/security", evidence: "Product limitation" },
      "final-round": { text: "Stealth Mode is described as hiding the app from supported screen shares and recordings. This is the vendor's claim, not an independent test.", source: "https://www.finalroundai.com/", evidence: "Vendor claim" },
      interviewlift: { text: "The site claims its overlay is hidden from screen sharing and recording. This is the vendor's claim, not an independent test.", source: "https://www.interviewlift.com/interview-copilot", evidence: "Vendor claim" },
      chiku: { text: "The site uses 'undetectable' language for supported meeting and coding platforms. This is the vendor's claim, not an independent test.", source: "https://www.chiku-ai.in/", evidence: "Vendor claim" },
      parakeet: { text: "The homepage claims invisibility in screen share, Dock, and Activity Monitor; its check date is shown on the vendor page. These remain vendor claims.", source: "https://www.parakeet-ai.com/", evidence: "Vendor claim" },
      cluely: { text: "A separate Pro + Undetectability tier is advertised as hidden from meeting screen sharing. This is the vendor's claim, not an independent test.", source: "https://cluely.com/pricing", evidence: "Vendor claim" },
    },
  },
] as const;

export const comparisonCheckedOn = "October 6, 2026";