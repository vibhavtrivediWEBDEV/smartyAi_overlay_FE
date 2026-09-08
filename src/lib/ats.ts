import type { JsonValue } from "@/lib/api";

export type ResumeLink = { platform: string; url: string };
export type ResumeProject = { name: string; description: string; technologies: string[]; links: string[] };

export type ATSResume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: ResumeProject[];
  achievements: string[];
  certifications: string[];
  languages: string[];
  links: ResumeLink[];
};

export type ATSScore = {
  total: number;
  jobDescriptionReady: boolean;
  categories: Record<"alignment" | "parseability" | "sections" | "evidence", { score: number; maximum: number; explanation: string }>;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
};

export const ATS_SCORE_VERSION = "ats-score-v2";

export const EMPTY_RESUME: ATSResume = {
  name: "",
  email: "",
  phone: "",
  location: "",
  headline: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  achievements: [],
  certifications: [],
  languages: [],
  links: [],
};

const STOP_WORDS = new Set("a an and are as at be been being by for from has have in into is it its of on or that the their this to was were will with you your our we they role work working experience required preferred ability strong using use including knowledge team years responsibilities qualifications candidate ideal minimum plus must should about who what when where how across within through".split(" "));
const ACTION_VERBS = ["achieved", "built", "created", "delivered", "designed", "developed", "drove", "implemented", "improved", "increased", "launched", "led", "managed", "optimized", "reduced", "resolved", "scaled", "shipped", "streamlined"];
const QUANTIFIED = /(?:\b\d+(?:\.\d+)?\s*(?:%|percent|x|ms|seconds?|minutes?|hours?|days?|weeks?|months?|years?|k|m|b|users?|customers?|requests?|projects?|people|teams?)\b|[$€£₹]\s*\d[\d,.]*|\b\d[\d,.]*\+?\b)/i;
const VAGUE = /\b(?:helped|assisted|worked on|responsible for|various|several|many things|duties included)\b/i;
const SECTION_HEADING_SIGNAL = /\b(?:summary|skills|experience|education|projects?|achievements?|certifications?)\b/i;

function strings(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return typeof value === "string" && value.trim() ? [value.trim()] : [];
  return value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [item.trim()] : [];
    if (!item || Array.isArray(item) || typeof item !== "object") return [];
    return [Object.values(item).filter((part) => typeof part === "string" && part.trim()).join(" | ")].filter(Boolean);
  });
}

function value(data: Record<string, JsonValue>, ...keys: string[]): JsonValue | undefined {
  for (const key of keys) if (data[key] !== undefined) return data[key];
  return undefined;
}

function text(data: Record<string, JsonValue>, ...keys: string[]): string {
  const found = value(data, ...keys);
  return typeof found === "string" ? found.trim() : "";
}

export function resumeFromProfile(data: Record<string, JsonValue>): ATSResume {
  const nested = data.profile;
  const profile = nested && !Array.isArray(nested) && typeof nested === "object" ? nested : data;
  const links = strings(value(profile, "links", "socialLinks", "externalLinks")).map((url) => ({ platform: "Link", url }));
  return {
    ...EMPTY_RESUME,
    name: text(profile, "name", "fullName") || text(data, "name", "fullName"),
    email: text(profile, "email"),
    phone: text(profile, "phone", "phoneNumber"),
    location: text(profile, "location", "address"),
    headline: text(profile, "headline", "title", "currentRole"),
    summary: text(profile, "summary", "about", "professionalSummary") || text(data, "summary"),
    skills: strings(value(profile, "skills", "technicalSkills")),
    experience: strings(value(profile, "experience", "workExperience", "employment")),
    education: strings(value(profile, "education")),
    achievements: strings(value(profile, "achievements", "accomplishments")),
    certifications: strings(value(profile, "certifications")),
    languages: strings(value(profile, "languages")),
    links,
  };
}

export function resumeToText(resume: ATSResume): string {
  return [resume.name, resume.email, resume.phone, resume.location, resume.headline, resume.summary, ...resume.skills, ...resume.experience, ...resume.education, ...resume.achievements, ...resume.certifications, ...resume.languages, ...resume.projects.flatMap((project) => [project.name, project.description, ...project.technologies, ...project.links]), ...resume.links.flatMap((link) => [link.platform, link.url])].join("\n");
}

export function resumeFromText(source: string): ATSResume {
  const text = source.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const rawLines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const headingPattern = /^(professional summary|summary|profile|skills|technical skills|experience|work experience|employment|education|projects|achievements|accomplishments|certifications|languages|links)$/i;
  const sections = new Map<string, string[]>();
  let current = "header";
  sections.set(current, []);
  for (const line of rawLines) {
    if (headingPattern.test(line.replace(/:$/, ""))) {
      current = line.replace(/:$/, "").toLowerCase();
      sections.set(current, []);
    } else {
      sections.get(current)?.push(line.replace(/^[•*-]\s*/, ""));
    }
  }
  const header = sections.get("header") ?? [];
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
  const take = (...names: string[]) => names.flatMap((name) => sections.get(name) ?? []);
  const linkValues = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return {
    ...EMPTY_RESUME,
    name: header.find((line) => !line.includes("@") && !/\d{4,}/.test(line) && line.length < 80) ?? "",
    email,
    phone,
    headline: header.filter((line) => line !== email && line !== phone)[1] ?? "",
    summary: take("professional summary", "summary", "profile").join(" "),
    skills: take("skills", "technical skills").flatMap((line) => line.split(/[,|•]/)).map((item) => item.trim()).filter(Boolean),
    experience: take("experience", "work experience", "employment"),
    education: take("education"),
    achievements: take("achievements", "accomplishments"),
    certifications: take("certifications"),
    languages: take("languages").flatMap((line) => line.split(/[,|•]/)).map((item) => item.trim()).filter(Boolean),
    projects: take("projects").map((description) => ({ name: "Project", description, technologies: [], links: [] })),
    links: linkValues.map((url) => ({ platform: "Link", url })),
  };
}

export function introducesUnsupportedNumbers(suggestion: string, resume: ATSResume): boolean {
  const sourceNumbers = new Set((resumeToText(resume).match(/\d+(?:\.\d+)?/g) ?? []).map(Number));
  return (suggestion.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).some((number) => !sourceNumbers.has(number));
}

function normalizedWords(value: string) {
  return value.normalize("NFKC").toLowerCase().match(/[a-z][a-z0-9]*(?:\.[a-z0-9]+|\+\+|#)?/g) ?? [];
}

function keywords(jobDescription: string) {
  const words = normalizedWords(jobDescription);
  const counts = new Map<string, number>();
  for (const word of words.filter((item) => item.length > 1 && !STOP_WORDS.has(item))) counts.set(word, (counts.get(word) ?? 0) + 1);
  for (let index = 0; index < words.length - 1; index += 1) {
    const left = words[index];
    const right = words[index + 1];
    if (STOP_WORDS.has(left) || STOP_WORDS.has(right) || left.length < 2 || right.length < 2) continue;
    const phrase = `${left} ${right}`;
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1.5);
  }
  return [...counts]
    .map(([term, count]) => ({ term, count, phrase: term.includes(" ") }))
    .sort((left, right) => right.count - left.count || Number(right.phrase) - Number(left.phrase) || left.term.localeCompare(right.term))
    .slice(0, 60);
}

export function assessJobDescription(jobDescription: string) {
  const meaningfulTerms = keywords(jobDescription);
  const wordCount = normalizedWords(jobDescription).length;
  const ready = jobDescription.trim().length >= 120 && wordCount >= 20 && meaningfulTerms.length >= 10;
  return {
    ready,
    wordCount,
    meaningfulTermCount: meaningfulTerms.length,
    guidance: ready
      ? "Job description ready for fit analysis."
      : "Paste the role responsibilities and requirements, not only the job title.",
  };
}

function containsTerm(text: string, term: string) {
  const escaped = term.split(" ").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
}

function bounded(value: number, maximum: number) {
  return Math.max(0, Math.min(maximum, Math.round(value)));
}

export function scoreResume(resume: ATSResume, jobDescription: string): ATSScore {
  const jobDescriptionAssessment = assessJobDescription(jobDescription);
  const terms = jobDescriptionAssessment.ready ? keywords(jobDescription) : [];
  const haystack = resumeToText(resume);
  const prominentText = `${resume.headline}\n${resume.summary}\n${resume.skills.join("\n")}`;
  const evidenceText = [...resume.experience, ...resume.achievements, ...resume.projects.flatMap((project) => [project.description, ...project.technologies])].join("\n");
  const matchedKeywords = terms.filter(({ term }) => containsTerm(haystack, term)).map(({ term }) => term);
  const missingKeywords = terms.filter(({ term }) => !containsTerm(haystack, term)).map(({ term }) => term);
  const totalWeight = terms.reduce((sum, item) => sum + item.count * (item.phrase ? 1.35 : 1), 0);
  const matchedWeight = terms.filter(({ term }) => matchedKeywords.includes(term)).reduce((sum, item) => {
    const base = item.count * (item.phrase ? 1.35 : 1);
    const placement = containsTerm(prominentText, item.term) ? 1.15 : containsTerm(evidenceText, item.term) ? 1.08 : 1;
    return sum + base * placement;
  }, 0);
  const titleLine = normalizedWords(jobDescription.split("\n").find((line) => line.trim()) ?? "").slice(0, 8).join(" ");
  const titleAligned = titleLine.length > 2 && normalizedWords(resume.headline).some((word) => titleLine.includes(word));
  const alignment = jobDescriptionAssessment.ready && totalWeight ? bounded(Math.min(1, matchedWeight / totalWeight) * 42 + (titleAligned ? 3 : 0), 45) : 0;
  const contactComplete = [resume.name, resume.email, resume.phone, resume.location].filter(Boolean).length;
  const sections = bounded(contactComplete * 0.75 + (resume.headline ? 2 : 0) + (resume.summary ? 3 : 0) + (resume.skills.length ? 3 : 0) + (resume.experience.length ? 3 : 0) + (resume.education.length ? 1 : 0), 15);
  const evidenceLines = [...resume.experience, ...resume.achievements, ...resume.projects.map((project) => project.description)].filter(Boolean);
  const quantified = evidenceLines.filter((line) => QUANTIFIED.test(line)).length;
  const actionLed = evidenceLines.filter((line) => ACTION_VERBS.some((verb) => new RegExp(`^\\s*(?:[-•]\\s*)?${verb}\\b`, "i").test(line))).length;
  const vague = evidenceLines.filter((line) => VAGUE.test(line)).length;
  const contextualMatches = terms.filter(({ term }) => containsTerm(evidenceText, term)).length;
  const evidence = bounded((evidenceLines.length ? 4 : 0) + Math.min(8, quantified * 2) + Math.min(7, actionLed * 1.4) + Math.min(6, contextualMatches * 0.6) - vague * 1.5, 25);
  const characters = resumeToText(resume).trim().length;
  const parseability = bounded((characters >= 300 ? 9 : characters >= 100 ? 6 : 2) + (SECTION_HEADING_SIGNAL.test(resumeToText(resume)) ? 1 : 0) + (resume.email ? 2 : 0) + (resume.phone ? 2 : 0) + (resume.experience.length ? 1 : 0), 15);
  const assessed = parseability + sections + evidence;
  const total = jobDescriptionAssessment.ready ? alignment + assessed : bounded((assessed / 55) * 100, 100);
  const suggestions = [
    ...(!resume.summary ? ["Add a concise professional summary."] : []),
    ...(!resume.skills.length ? ["Add a standard Skills section."] : []),
    ...(!resume.experience.length ? ["Add experience entries with title, company, dates, and outcomes."] : []),
    ...(vague ? [`Rewrite ${vague} vague statement${vague === 1 ? "" : "s"} as action + task + result.`] : []),
    ...(evidenceLines.length && !quantified ? ["Add verified metrics where you can substantiate them."] : []),
    ...(jobDescription.trim() && !jobDescriptionAssessment.ready ? [jobDescriptionAssessment.guidance] : []),
    ...(jobDescriptionAssessment.ready && missingKeywords.length ? ["Review missing job keywords and add only those supported by your real experience."] : []),
  ];
  return {
    total,
    jobDescriptionReady: jobDescriptionAssessment.ready,
    categories: {
      alignment: { score: alignment, maximum: 45, explanation: jobDescriptionAssessment.ready ? `${matchedKeywords.length} of ${terms.length} exact terms or phrases matched, weighted by frequency and placement.` : jobDescriptionAssessment.guidance },
      parseability: { score: parseability, maximum: 15, explanation: "Checks selectable content, contact extraction, standard headings, and a single-column output." },
      sections: { score: sections, maximum: 15, explanation: "Checks contact details, headline, and standard resume sections." },
      evidence: { score: evidence, maximum: 25, explanation: `${quantified} quantified, ${actionLed} action-led, and ${contextualMatches} job-relevant evidence signals found.` },
    },
    matchedKeywords,
    missingKeywords,
    suggestions,
  };
}