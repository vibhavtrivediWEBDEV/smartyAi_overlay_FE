import type { LucideIcon } from "lucide-react";
import { Award, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronRight, ExternalLink, FileText, GraduationCap, Languages, Link2, MapPin, Sparkles, Target, UserRound } from "lucide-react";
import type { Account, JsonValue, ProfileContext } from "@/lib/api";
import { resumeFromProfile, type ATSResume } from "@/lib/ats";

type ProfileReadmeProps = {
  account: Account;
  context: ProfileContext;
};

type ProfileSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: string[];
};

const KNOWN_KEYS = new Set([
  "name", "fullName", "email", "phone", "phoneNumber", "location", "address", "headline", "title", "currentRole",
  "summary", "about", "professionalSummary", "skills", "technicalSkills", "experience", "workExperience", "employment",
  "education", "projects", "achievements", "accomplishments", "certifications", "languages", "links", "socialLinks", "externalLinks",
]);

function formatLabel(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "No update recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SA";
}

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function stringifyValue(value: JsonValue): string {
  if (value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join(" · ");
  return Object.entries(value).map(([key, item]) => {
    const rendered = stringifyValue(item);
    return rendered ? `${formatLabel(key)}: ${rendered}` : "";
  }).filter(Boolean).join(" · ");
}

function profileValues(data: Record<string, JsonValue>, ...keys: string[]) {
  const profile = isRecord(data.profile) ? data.profile : data;
  const value = keys.map((key) => profile[key]).find((candidate) => candidate !== undefined);
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map(stringifyValue).filter(Boolean);
}

function extraDetails(data: Record<string, JsonValue>) {
  const nestedProfile = isRecord(data.profile) ? data.profile : data;
  return Object.entries(nestedProfile)
    .filter(([key, value]) => !KNOWN_KEYS.has(key) && key !== "profile" && stringifyValue(value))
    .map(([key, value]) => ({ label: formatLabel(key), value: stringifyValue(value) }));
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function profileLinks(data: Record<string, JsonValue>) {
  const profile = isRecord(data.profile) ? data.profile : data;
  const candidates = [profile.links, profile.socialLinks, profile.externalLinks].flatMap((value) => Array.isArray(value) ? value : value ? [value] : []);
  return candidates.flatMap((value) => {
    if (typeof value === "string") return [{ platform: "Website", url: value }];
    if (!isRecord(value)) return [];
    const url = typeof value.url === "string" ? value.url : typeof value.href === "string" ? value.href : "";
    const platform = typeof value.platform === "string" ? value.platform : typeof value.label === "string" ? value.label : "Website";
    return url ? [{ platform, url }] : [];
  });
}

function sectionData(resume: ATSResume, data: Record<string, JsonValue>): ProfileSection[] {
  return [
    { id: "experience", label: "Experience", icon: BriefcaseBusiness, items: resume.experience },
    { id: "projects", label: "Selected work", icon: Sparkles, items: profileValues(data, "projects") },
    { id: "education", label: "Education", icon: GraduationCap, items: resume.education },
    { id: "achievements", label: "Achievements", icon: Award, items: resume.achievements },
    { id: "certifications", label: "Certifications", icon: CheckCircle2, items: resume.certifications },
    { id: "languages", label: "Languages", icon: Languages, items: resume.languages },
  ].filter((section) => section.items.length > 0);
}

function EmptyProfile() {
  return <div className="border border-white/10 bg-[#12120f] px-6 py-14 text-center md:px-12">
    <div className="mx-auto grid h-14 w-14 place-items-center border border-gold/30 bg-gold/5 text-gold"><FileText size={22} /></div>
    <h2 className="display-type mt-6 text-2xl font-semibold">Your profile is ready for a story</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#8f887d]">Use non-sensitive sample data in the browser-local resume demo. Automatic desktop profile synchronization is disabled.</p>
  </div>;
}

export function ProfileReadme({ account, context }: ProfileReadmeProps) {
  if (!context.resume) return <EmptyProfile />;

  const data = context.resume.data;
  const resume = resumeFromProfile(data);
  const profileName = resume.name || account.name || "SmartyAI member";
  const profileEmail = resume.email || account.email;
  const sections = sectionData(resume, data);
  const extras = extraDetails(data);
  const links = profileLinks(data).map((link) => ({ ...link, safeUrl: safeUrl(link.url) })).filter((link) => link.safeUrl);
  const navigation = [
    ...(resume.summary ? [{ id: "about", label: "About", icon: UserRound }] : []),
    ...(resume.skills.length ? [{ id: "expertise", label: "Expertise", icon: Target }] : []),
    ...sections.map(({ id, label, icon }) => ({ id, label, icon })),
    ...(context.jobDescription?.text ? [{ id: "role-context", label: "Role context", icon: BookOpen }] : []),
    ...(extras.length ? [{ id: "details", label: "More details", icon: FileText }] : []),
  ];

  return <article className="overflow-hidden border border-white/10 bg-[#11110f] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
    <header className="relative overflow-hidden border-b border-white/10 bg-[#171611] px-6 py-8 md:px-10 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(230,197,122,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(230,197,122,.08)_1px,transparent_1px)] bg-size-[42px_42px] opacity-35" />
      <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="display-type grid h-20 w-20 shrink-0 place-items-center border border-gold/40 bg-[#0d0d0b] text-2xl font-semibold text-gold shadow-[8px_8px_0_rgba(201,163,91,.12)]">{initials(profileName)}</div>
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-gold"><span className="h-1.5 w-1.5 bg-emerald-400" />Professional profile</p>
            <h2 className="display-type wrap-break-word text-3xl font-semibold leading-tight md:text-4xl">{profileName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8b0a3]">{resume.headline || "Demo professional context"}</p>
          </div>
        </div>
        <div className="grid shrink-0 gap-1 text-xs text-[#8f887d] sm:text-right">
          {resume.location && <span className="flex items-center gap-2 sm:justify-end"><MapPin size={13} />{resume.location}</span>}
          <a href={`mailto:${profileEmail}`} className="hover:text-gold">{profileEmail}</a>
          <span>Updated {formatDate(context.updatedAt || context.resume.syncedAt)}</span>
        </div>
      </div>
    </header>

    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-[#0d0d0b] p-5 lg:border-b-0 lg:border-r lg:p-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#6f695f]">Profile tree</p>
        <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto lg:grid lg:overflow-visible">
          {navigation.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className="group flex shrink-0 items-center gap-3 border-l border-white/10 px-3 py-2.5 text-xs text-[#8f887d] transition hover:border-gold hover:bg-white/3 hover:text-white"><Icon size={15} className="text-[#625d55] group-hover:text-gold" /><span>{label}</span><ChevronRight size={13} className="ml-auto hidden text-[#4f4b44] lg:block" /></a>)}
        </nav>
        <div className="mt-7 hidden border-t border-white/10 pt-5 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#625d55]">Source</p>
          <p className="mt-2 wrap-break-word text-xs leading-5 text-[#8f887d]">{context.resume.source || "SmartyAI desktop"}</p>
        </div>
      </aside>

      <div className="min-w-0 px-6 py-8 md:px-10 md:py-10">
        {resume.summary && <section id="about" className="scroll-mt-6 border-b border-white/10 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">01 / About</p>
          <p className="display-type mt-5 max-w-3xl text-xl font-medium leading-8 text-[#e8e1d6] md:text-2xl md:leading-9">{resume.summary}</p>
        </section>}

        {resume.skills.length > 0 && <section id="expertise" className="scroll-mt-6 border-b border-white/10 py-10">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Expertise</p><h3 className="display-type mt-2 text-2xl font-semibold">What {profileName.split(" ")[0]} brings</h3></div><span className="text-xs text-[#625d55]">{resume.skills.length} capabilities</span></div>
          <div className="mt-6 flex flex-wrap gap-2">{resume.skills.map((skill) => <span key={skill} className="border border-white/10 bg-white/2.5 px-3 py-2 text-xs text-[#d6cfc3] hover:border-gold/40 hover:text-white">{skill}</span>)}</div>
        </section>}

        {sections.map((section) => {
          const Icon = section.icon;
          return <section key={section.id} id={section.id} className="scroll-mt-6 border-b border-white/10 py-10 last:border-b-0">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center border border-gold/25 text-gold"><Icon size={17} /></div><h3 className="display-type text-2xl font-semibold">{section.label}</h3></div>
            <div className="relative mt-7 grid gap-0 before:absolute before:bottom-2 before:left-1.25 before:top-2 before:w-px before:bg-white/10">
              {section.items.map((item, index) => <div key={`${section.id}-${index}`} className="relative grid grid-cols-[12px_minmax(0,1fr)] gap-5 pb-7 last:pb-0"><span className="relative z-10 mt-2 h-2.75 w-2.75 border-2 border-[#11110f] bg-gold ring-1 ring-gold/50" /><p className="whitespace-pre-wrap text-sm leading-7 text-[#c8c0b4]">{item}</p></div>)}
            </div>
          </section>;
        })}

        {context.jobDescription?.text && <section id="role-context" className="scroll-mt-6 border-b border-white/10 py-10">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center border border-gold/25 text-gold"><BookOpen size={17} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#777066]">Private matching context</p><h3 className="display-type mt-1 text-2xl font-semibold">Current target role</h3></div></div>
          <p className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap border-l-2 border-gold/40 pl-5 text-sm leading-7 text-[#aaa397]">{context.jobDescription.text}</p>
        </section>}

        {(links.length > 0 || extras.length > 0) && <section id="details" className="scroll-mt-6 pt-10">
          <h3 className="display-type text-2xl font-semibold">Links & details</h3>
          {links.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{links.map((link) => <a key={link.url} href={link.safeUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-white/10 px-3 py-2 text-xs text-[#c8c0b4] hover:border-gold/40 hover:text-gold"><Link2 size={14} />{link.platform}<ExternalLink size={12} /></a>)}</div>}
          {extras.length > 0 && <dl className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">{extras.map((detail) => <div key={detail.label} className="min-w-0 bg-[#11110f] p-4"><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-[#777066]">{detail.label}</dt><dd className="mt-2 wrap-break-word text-sm leading-6 text-[#c8c0b4]">{detail.value}</dd></div>)}</dl>}
        </section>}
      </div>
    </div>
  </article>;
}