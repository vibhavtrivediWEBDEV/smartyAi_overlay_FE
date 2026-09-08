"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bot, Check, ChevronRight, Download, Eye, FileText, LoaderCircle, LockKeyhole, PencilLine, RefreshCw, Save, ShieldCheck, Sparkles, Target, Upload, X } from "lucide-react";
import { assessJobDescription, ATS_SCORE_VERSION, EMPTY_RESUME, resumeFromText, scoreResume, type ATSResume } from "@/lib/ats";
import { downloadResumePdf, extractPdfText } from "@/lib/ats-pdf";

const DEMO_DRAFT_KEY = "smartyai_demo_ats_draft";
const SECTIONS = ["Personal", "Summary", "Skills", "Experience", "Education", "Projects", "Achievements", "Certifications", "Languages", "Links"] as const;
const CONTACT_FIELD_IDS = new Set(["name", "email", "phone", "location"]);
type Section = typeof SECTIONS[number];
type WorkspaceMode = "editor" | "view";
type ResumeOptimization = {
  optimizedResume: ATSResume;
  targetRole: string;
  summary: string;
  changes: Array<{ section: string; before: string; after: string; reason: string; keywordsAddressed: string[] }>;
  missingEvidenceQuestions: string[];
  prioritizedKeywords: string[];
  promptVersion: string;
  beforeScore: number;
  afterScore: number;
};
type FieldOptimizationRequest = {
  id: string;
  label: string;
  before: string;
  read: (resume: ATSResume) => string;
  apply: (resume: ATSResume, value: string) => ATSResume;
};
type FieldSuggestion = FieldOptimizationRequest & { after: string; reason: string; scoreDelta: number };

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function sectionProgress(section: Section, resume: ATSResume) {
  const values: Record<Section, unknown[]> = {
    Personal: [resume.name, resume.email, resume.phone, resume.location, resume.headline],
    Summary: [resume.summary],
    Skills: resume.skills,
    Experience: resume.experience,
    Education: resume.education,
    Projects: resume.projects.filter((project) => project.name || project.description),
    Achievements: resume.achievements,
    Certifications: resume.certifications,
    Languages: resume.languages,
    Links: resume.links,
  };
  const filled = values[section].filter(Boolean).length;
  return { filled, complete: section === "Personal" ? filled === 5 : filled > 0 };
}

export function ATSResumeBuilder() {
  const [resume, setResume] = useState<ATSResume>(EMPTY_RESUME);
  const [sourceResume, setSourceResume] = useState<ATSResume>(EMPTY_RESUME);
  const [jobDescription, setJobDescription] = useState("");
  const [section, setSection] = useState<Section>("Personal");
  const [mode, setMode] = useState<WorkspaceMode>("editor");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [fieldSuggestion, setFieldSuggestion] = useState<FieldSuggestion | null>(null);
  const [optimizingField, setOptimizingField] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(DEMO_DRAFT_KEY);
        if (stored) {
          const draft = JSON.parse(stored) as { resume?: ATSResume; jobDescription?: string };
          if (draft.resume) {
            setResume(draft.resume);
            setSourceResume(draft.resume);
          }
          if (typeof draft.jobDescription === "string") setJobDescription(draft.jobDescription);
        }
      } catch {
        setError("The local demo draft could not be read.");
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const score = useMemo(() => scoreResume(resume, jobDescription), [resume, jobDescription]);
  const jobDescriptionAssessment = useMemo(() => assessJobDescription(jobDescription), [jobDescription]);
  const completedSections = useMemo(() => SECTIONS.filter((item) => sectionProgress(item, resume).complete).length, [resume]);
  const profileCompletion = Math.round((completedSections / SECTIONS.length) * 100);
  const saveDraft = async () => {
    setStatus(""); setError("");
    try {
      window.localStorage.setItem(DEMO_DRAFT_KEY, JSON.stringify({ resume, jobDescription }));
      setSourceResume(resume);
      setStatus("Demo draft saved in this browser only.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the draft."); }
  };
  const importPdf = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF resume."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("PDF must be 10 MB or smaller."); return; }
    setImporting(true); setError(""); setStatus("");
    try {
      const text = await extractPdfText(file);
      if (text.trim().length < 40) throw new Error("This PDF has little selectable text. Try a text-based PDF or use the structured editor.");
      const imported = resumeFromText(text);
      setResume(imported); setSourceResume(imported); setStatus(`Imported ${file.name} locally. Review the extracted fields before saving.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The PDF could not be read."); }
    finally { setImporting(false); if (inputRef.current) inputRef.current.value = ""; }
  };
  const optimizeResume = async () => {
    if (!jobDescriptionAssessment.ready) {
      setError(jobDescriptionAssessment.guidance);
      jobDescriptionRef.current?.focus();
      jobDescriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setOptimization(null); setOptimizing(false); setError("");
    setStatus("AI optimization is disabled in this demo so resume and job-description data are not transmitted.");
  };
  const optimizeField = async (request: FieldOptimizationRequest) => {
    if (CONTACT_FIELD_IDS.has(request.id)) {
      setFieldSuggestion(null); setError("");
      setStatus(`${request.label} is contact data, not ATS optimization content. It already counts once present, so AI will not rewrite it for a cosmetic score claim.`);
      return;
    }
    if (!jobDescriptionAssessment.ready) {
      setError(jobDescriptionAssessment.guidance);
      jobDescriptionRef.current?.focus();
      jobDescriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setOptimizingField(""); setFieldSuggestion(null); setError("");
    setStatus(`AI changes for ${request.label.toLowerCase()} are disabled in this demo so your data stays in this browser.`);
  };
  const applyFieldSuggestion = () => {
    if (!fieldSuggestion) return;
    setResume((current) => fieldSuggestion.apply(current, fieldSuggestion.after));
    setStatus(`${fieldSuggestion.label} updated. Review the wording, then save your draft.`);
    setFieldSuggestion(null);
  };
  const applyOptimization = () => {
    if (!optimization) return;
    setResume(optimization.optimizedResume);
    setOptimization(null);
    setStatus("ATS optimization applied. Verify every statement before saving or downloading.");
  };

  if (loading) return <div className="grid min-h-[55vh] place-items-center text-sm text-[#8f887d]"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Loading resume workspace...</div>;
  return <div className="mx-auto max-w-[1680px]">
    <section className="relative mb-5 overflow-hidden border border-gold/25 bg-[#11110e] shadow-[0_24px_80px_rgba(0,0,0,.34)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(230,197,122,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(230,197,122,.045)_1px,transparent_1px)] bg-size-[48px_48px]" />
      <div className="relative grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-6 py-8 md:px-9 md:py-10">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-gold"><span className="h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.75)]" />Browser-local resume demo</div>
          <h1 className="display-type mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-normal md:text-5xl">Build the resume that enters first.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9e978b]">Use non-sensitive sample data to explore the editor. PDF parsing and draft storage stay in this browser; AI optimization is disabled in the demo.</p>
          <div className="mt-7 grid max-w-3xl gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            <AgentStep number="01" label="Analyze" detail={jobDescriptionAssessment.ready ? "Role mapped" : "Add target role"} active={!optimization} />
            <AgentStep number="02" label="Review" detail="Evidence checked" active={Boolean(optimization)} />
            <AgentStep number="03" label="Apply" detail="You approve" />
          </div>
        </div>
        <div className="relative border-t border-gold/20 bg-[#c9a35b] p-6 text-[#12100b] xl:border-l xl:border-t-0 md:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/55">{score.jobDescriptionReady ? "Live target fit" : "Resume readiness"}</p><p className="display-type mt-3 text-6xl font-semibold leading-none">{score.total}<span className="text-lg text-black/45">/100</span></p></div><Target size={28} strokeWidth={1.5} /></div>
          <p className="mt-4 text-xs font-semibold leading-5 text-black/65">{score.jobDescriptionReady ? `${score.matchedKeywords.length} role terms matched with ${score.missingKeywords.length} evidence gaps to review.` : "Complete the role brief to unlock evidence-based matching."}</p>
          <div className="mt-6 h-1.5 bg-black/15"><div className="h-full bg-[#15130e] transition-[width] duration-500" style={{ width: `${score.total}%` }} /></div>
          <div className="mt-6 grid grid-cols-2 gap-px bg-black/15 text-[10px] font-bold uppercase tracking-[.08em]"><span className="flex items-center gap-2 bg-[#d5b46e] px-3 py-3"><ShieldCheck size={14} />Facts guarded</span><span className="flex items-center gap-2 bg-[#d5b46e] px-3 py-3"><LockKeyhole size={14} />Private draft</span></div>
        </div>
      </div>
      <div className="relative flex flex-col gap-3 border-t border-white/10 bg-[#0b0b09]/90 p-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex min-w-0 gap-2 overflow-x-auto">
          <div className="flex h-10 shrink-0 border border-white/15 bg-[#090908] p-1" role="group" aria-label="Resume workspace mode">
            <ModeButton active={mode === "editor"} icon={PencilLine} label="Editor" onClick={() => setMode("editor")} />
            <ModeButton active={mode === "view"} icon={Eye} label="Preview" onClick={() => setMode("view")} />
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void importPdf(event.target.files?.[0])} />
          <ToolbarButton icon={importing ? LoaderCircle : Upload} label={importing ? "Reading PDF..." : "Import PDF"} onClick={() => inputRef.current?.click()} disabled={importing} />
          <ToolbarButton icon={RefreshCw} label="Account resume" onClick={() => { setResume(sourceResume); setStatus("Loaded the current account resume."); }} />
          <ToolbarButton icon={Save} label="Save draft" onClick={() => void saveDraft()} />
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => void optimizeResume()} disabled={optimizing} className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-gold/60 bg-gold/8 px-4 text-xs font-bold text-gold hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 md:flex-none">{optimizing ? <LoaderCircle className="animate-spin" size={15} /> : <Bot size={15} />}{optimizing ? "Agent analyzing..." : "Run ATS agent"}</button>
          <button type="button" onClick={() => downloadResumePdf(resume)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 bg-gold px-4 text-xs font-bold text-ink hover:bg-gold-bright md:flex-none"><Download size={15} />Export PDF</button>
        </div>
      </div>
    </section>
    {(status || error) && <div role={error ? "alert" : "status"} className={`mb-5 border p-3 text-sm ${error ? "border-red-400/25 bg-red-400/5 text-red-300" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"}`}>{error || status}</div>}
    {mode === "editor" ? <div className="ats-workspace-grid grid items-start gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="border border-white/10 bg-[#10100e] lg:sticky lg:top-5 lg:self-start">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]">Profile strength</p><span className="text-xs font-bold text-gold">{profileCompletion}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden bg-white/8"><div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${profileCompletion}%` }} /></div>
          <p className="mt-2 text-[11px] leading-5 text-[#777066]">{completedSections} of {SECTIONS.length} sections started</p>
        </div>
        <nav className="grid grid-cols-2 gap-px bg-white/5 p-px sm:grid-cols-5 lg:grid-cols-1" aria-label="Resume sections">{SECTIONS.map((item) => {
          const progress = sectionProgress(item, resume);
          return <button key={item} type="button" onClick={() => { setSection(item); setFieldSuggestion(null); }} className={`group flex min-h-11 items-center justify-between gap-2 px-3 text-left text-xs transition ${section === item ? "bg-gold font-bold text-ink" : "bg-[#10100e] text-[#aaa397] hover:bg-white/8 hover:text-white"}`}><span>{item}</span><span className={`grid h-5 min-w-5 place-items-center text-[10px] ${section === item ? "text-ink/70" : progress.complete ? "text-emerald-300" : "text-[#625d55]"}`}>{progress.complete ? <Check size={13} /> : progress.filled || <ChevronRight size={13} />}</span></button>;
        })}</nav>
      </aside>
      <main className="ats-editor-light min-w-0 overflow-hidden border border-[#d9d6cd] bg-[#f5f3ed] text-[#171713]">
        <div className="flex items-center justify-between border-b border-[#d9d6cd] bg-white px-5 py-4 md:px-7"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8b6823]">Resume details</p><h2 className="mt-1 text-xl font-bold">{section}</h2></div><div className="flex items-center gap-3"><button type="button" onClick={() => setMode("view")} className="inline-flex items-center gap-2 text-xs font-bold text-[#6c665c] hover:text-black"><Eye size={15} />Preview</button><FileText size={20} className="text-[#aaa49a]" /></div></div>
        <div className="min-h-111.5 p-5 md:p-8"><SectionEditor section={section} resume={resume} setResume={setResume} optimizeField={optimizeField} optimizingField={optimizingField} fieldSuggestion={fieldSuggestion} applyFieldSuggestion={applyFieldSuggestion} dismissFieldSuggestion={() => setFieldSuggestion(null)} /></div>
        <div className="flex items-center justify-between border-t border-[#d9d6cd] bg-white px-5 py-3 text-[11px] text-[#777066] md:px-7"><span>Changes stay local until you save the draft.</span><button type="button" onClick={() => setSection(SECTIONS[Math.min(SECTIONS.indexOf(section) + 1, SECTIONS.length - 1)])} className="inline-flex items-center gap-1 font-bold text-[#8b6823]">Next section <ChevronRight size={13} /></button></div>
      </main>
      <aside className="ats-analysis-panel min-w-0 space-y-4 xl:col-span-2">
        <section className="border border-white/10 bg-[#12120f] p-5">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]">{score.jobDescriptionReady ? "Target fit score" : "Resume health"} · {ATS_SCORE_VERSION}</p><p className="mt-2 text-xs leading-5 text-[#777066]">{score.jobDescriptionReady ? "Measured against the pasted role." : "General quality until a full job description is ready."}</p></div><div className="relative grid h-21 w-21 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#e6c57a ${score.total * 3.6}deg, #2b2924 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-[#12120f]"><span className="text-xl font-bold">{score.total}<span className="text-[10px] text-[#777066]">/100</span></span></div></div></div>
        </section>
        <section className="border border-white/10 bg-[#12120f] p-5">
          <div className="flex items-center justify-between gap-3"><label className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]" htmlFor="job-description">Target job description</label><span className={`text-[10px] font-bold ${jobDescriptionAssessment.ready ? "text-emerald-300" : "text-amber-200"}`}>{jobDescriptionAssessment.ready ? "Ready" : `${jobDescriptionAssessment.wordCount} words`}</span></div>
          <textarea ref={jobDescriptionRef} id="job-description" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setError(""); }} rows={7} placeholder="Paste the responsibilities, qualifications, and requirements for one target role..." className={`ats-field mt-3 resize-y ${jobDescription.trim() && !jobDescriptionAssessment.ready ? "border-amber-300/50" : ""}`} />
          {!jobDescriptionAssessment.ready ? <p className="mt-3 flex gap-2 text-[11px] leading-5 text-amber-100/80"><AlertCircle className="mt-0.5 shrink-0" size={14} />{jobDescriptionAssessment.guidance} Fit keywords stay off until then.</p> : <p className="mt-3 text-[11px] text-[#8f887d]">{score.matchedKeywords.length} matched · {score.missingKeywords.length} missing. Add terms only when truthful.</p>}
          {score.jobDescriptionReady && <><KeywordList title="Matched" values={score.matchedKeywords} tone="matched" /><KeywordList title="Missing" values={score.missingKeywords} tone="missing" /></>}
          <button type="button" onClick={() => void optimizeResume()} disabled={optimizing} className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-gold px-4 text-xs font-bold text-ink hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50">{optimizing ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}{optimizing ? "Building review..." : "Run AI optimization"}</button>
          <div className="mt-3 grid grid-cols-3 border border-white/10 text-center text-[9px] font-bold uppercase tracking-[.08em] text-[#777066]"><span className="border-r border-white/10 px-1 py-2 text-gold">1 Analyze</span><span className="border-r border-white/10 px-1 py-2">2 Review</span><span className="px-1 py-2">3 Apply</span></div>
          <p className="mt-2 text-center text-[10px] leading-4 text-[#777066]">AI drafts edits. You choose “Apply optimized resume” after reviewing every change.</p>
        </section>
        <section className="border border-white/10 bg-[#12120f] p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]">Score breakdown</p><div className="mt-4 space-y-3">{Object.entries(score.categories).map(([name, category]) => <div key={name} title={category.explanation}><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="capitalize text-[#aaa397]">{name}</span><span className="font-bold">{category.score}<span className="text-[#625d55]">/{category.maximum}</span></span></div><div className="h-1 bg-white/8"><div className="h-full bg-gold" style={{ width: `${category.maximum ? (category.score / category.maximum) * 100 : 0}%` }} /></div></div>)}</div>{score.suggestions.length > 0 && <div className="mt-5 space-y-2 border-t border-white/10 pt-4">{score.suggestions.slice(0, 4).map((suggestion) => <p key={suggestion} className="border-l border-gold/50 pl-3 text-[11px] leading-5 text-[#aaa397]">{suggestion}</p>)}</div>}</section>
      </aside>
    </div> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(600px,1fr)_320px]">
      <section className="min-w-0 border border-white/10 bg-[#090908] p-3 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Document preview</p><p className="mt-1 text-xs text-[#777066]">A4 layout · selectable text · single column</p></div><FileText size={19} className="text-[#777066]" /></div>
        <div className="overflow-x-auto pb-2"><ResumePreview resume={resume} fullPage /></div>
      </section>
      <aside className="space-y-5 xl:sticky xl:top-5">
        <section className="border border-white/10 bg-[#10100e] p-5"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#777066]">{jobDescription.trim() ? "Job-fit readiness" : "General readiness"} · {ATS_SCORE_VERSION}</p><p className="display-type mt-2 text-5xl font-semibold">{score.total}<span className="text-lg text-[#777066]">/100</span></p></div><span className={`mb-2 h-3 w-3 ${score.total >= 75 ? "bg-emerald-400" : score.total >= 50 ? "bg-amber-400" : "bg-red-400"}`} /></div><p className="mt-3 text-xs leading-5 text-[#777066]">A transparent readiness estimate, not a hiring guarantee.</p></section>
        <section className="border border-white/10 bg-[#12120f] p-5"><label className="ats-label" htmlFor="view-job-description">Target job description</label><textarea id="view-job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={7} placeholder="Paste one target job description..." className="ats-field resize-y" /><p className="mt-2 text-[11px] text-[#777066]">{score.matchedKeywords.length} matched · {score.missingKeywords.length} missing</p><KeywordList title="Matched" values={score.matchedKeywords} tone="matched" /><KeywordList title="Missing" values={score.missingKeywords} tone="missing" /></section>
        <section className="border border-white/10 bg-[#12120f] p-5"><p className="ats-label">Priority improvements</p><div className="space-y-2">{score.suggestions.slice(0, 5).map((suggestion) => <p key={suggestion} className="border-l border-gold/50 pl-3 text-xs leading-5 text-[#aaa397]">{suggestion}</p>)}</div></section>
      </aside>
    </div>}
    {optimization && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 md:p-8"><div role="dialog" aria-modal="true" aria-labelledby="optimization-title" className="mx-auto w-full max-w-4xl border border-white/15 bg-[#151411] p-5 shadow-2xl md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Dedicated resume agent · {optimization.promptVersion}</p><h2 id="optimization-title" className="mt-1 text-xl font-bold">ATS optimization review</h2><p className="mt-1 text-xs text-[#8f887d]">Target: {optimization.targetRole || "Role detected from job description"}</p></div><button type="button" title="Close" onClick={() => setOptimization(null)} className="p-2 text-[#8f887d] hover:text-white"><X size={18} /></button></div><div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><div className="bg-[#10100e] p-4"><p className="ats-label">Before</p><p className="text-3xl font-bold">{optimization.beforeScore}<span className="text-sm text-[#777066]">/100</span></p></div><div className="bg-[#10100e] p-4"><p className="ats-label">After</p><p className="text-3xl font-bold text-emerald-300">{optimization.afterScore}<span className="text-sm text-[#777066]">/100</span></p><p className={`mt-1 text-xs ${optimization.afterScore > optimization.beforeScore ? "text-emerald-300" : "text-amber-200"}`}>{optimization.afterScore > optimization.beforeScore ? `+${optimization.afterScore - optimization.beforeScore} deterministic points` : "No deterministic score increase; review evidence gaps below"}</p></div></div><p className="mt-4 text-sm leading-6 text-[#aaa397]">{optimization.summary}</p><div className="mt-5 max-h-[42vh] space-y-3 overflow-y-auto pr-2">{optimization.changes.map((change, index) => <div key={`${change.section}-${index}`} className="border-l-2 border-gold/50 pl-4"><p className="text-[10px] font-bold uppercase text-gold">{change.section}</p><p className="mt-1 text-xs leading-5 text-[#777066] line-through">{change.before}</p><p className="mt-1 text-sm leading-6 text-white">{change.after}</p><p className="mt-1 text-xs text-[#8f887d]">{change.reason}</p></div>)}</div>{optimization.prioritizedKeywords.length > 0 && <p className="mt-5 text-xs leading-5 text-[#aaa397]"><strong className="text-white">Prioritized:</strong> {optimization.prioritizedKeywords.join(", ")}</p>}{optimization.missingEvidenceQuestions.length > 0 && <div className="mt-4 border border-amber-300/20 bg-amber-300/4 p-4"><p className="text-xs font-bold text-amber-200">Evidence needed before claiming these requirements</p>{optimization.missingEvidenceQuestions.map((question) => <p key={question} className="mt-2 text-xs leading-5 text-[#c9bfae]">{question}</p>)}</div>}<div className="mt-6 flex justify-end gap-2"><ToolbarButton icon={X} label="Reject" onClick={() => setOptimization(null)} /><button type="button" onClick={applyOptimization} className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-xs font-bold text-ink"><Check size={15} />Apply optimized resume</button></div></div></div>}
  </div>;
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Eye; label: string; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`inline-flex items-center gap-2 px-3 text-xs font-bold transition ${active ? "bg-paper text-ink" : "text-[#8f887d] hover:text-white"}`}><Icon size={14} />{label}</button>; }
function ToolbarButton({ icon: Icon, label, onClick, disabled }: { icon: typeof Save; label: string; onClick: () => void; disabled?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-10 items-center gap-2 border border-white/15 px-3 text-xs font-bold text-[#aaa397] hover:border-white/30 hover:text-white disabled:opacity-50"><Icon size={15} className={label.includes("...") ? "animate-spin" : ""} />{label}</button>; }
function AgentStep({ number, label, detail, active = false }: { number: string; label: string; detail: string; active?: boolean }) { return <div className={`min-w-0 bg-[#11110e] p-3.5 ${active ? "shadow-[inset_0_-2px_0_#c9a35b]" : ""}`}><div className="flex items-center justify-between gap-2"><span className={active ? "text-gold" : "text-[#625d55]"}>{number}</span>{active && <span className="h-1.5 w-1.5 bg-gold shadow-[0_0_10px_rgba(230,197,122,.7)]" />}</div><p className="mt-2 text-xs font-bold text-[#ded7cc]">{label}</p><p className="mt-1 truncate text-[10px] text-[#777066]">{detail}</p></div>; }
type FieldAiProps = { onOptimize: () => void; loading: boolean; suggestion?: FieldSuggestion; onApply: () => void; onDismiss: () => void };
function FieldAiHeader({ label, ai }: { label: string; ai: FieldAiProps }) { return <span className="mb-2 flex items-center justify-between gap-3"><span className="ats-label mb-0!">{label}</span><button type="button" onClick={ai.onOptimize} disabled={ai.loading} title={`Improve ${label} with AI`} className="inline-flex h-7 items-center gap-1.5 border border-[#c9b06f] bg-[#fffdf7] px-2.5 text-[10px] font-bold text-[#765719] transition hover:border-[#8b6823] hover:bg-[#f7eed5] disabled:cursor-wait disabled:opacity-60">{ai.loading ? <LoaderCircle className="animate-spin" size={12} /> : <Sparkles size={12} />}{ai.loading ? "Thinking" : "Improve"}</button></span>; }
function FieldSuggestionPanel({ suggestion, onApply, onDismiss }: { suggestion?: FieldSuggestion; onApply: () => void; onDismiss: () => void }) { if (!suggestion) return null; return <div className="mt-2 border border-[#d5c38f] bg-[#fffaf0] p-3"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="text-[9px] font-bold uppercase text-[#8b6823]">AI suggestion</p><span className="bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">+{suggestion.scoreDelta} ATS</span></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#27231c]">{suggestion.after}</p></div><button type="button" onClick={onDismiss} title="Dismiss suggestion" className="shrink-0 p-1 text-[#8c8375] hover:text-black"><X size={14} /></button></div><p className="mt-2 text-[10px] leading-4 text-[#756d61]">{suggestion.reason}</p><button type="button" onClick={onApply} className="mt-3 inline-flex h-8 items-center gap-1.5 bg-[#171713] px-3 text-[10px] font-bold text-white hover:bg-black"><Check size={13} />Apply to field</button></div>; }
function Field({ label, value, onChange, type = "text", ai }: { label: string; value: string; onChange: (value: string) => void; type?: string; ai: FieldAiProps }) { return <div className="block"><FieldAiHeader label={label} ai={ai} /><input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="ats-field" /><FieldSuggestionPanel suggestion={ai.suggestion} onApply={ai.onApply} onDismiss={ai.onDismiss} /></div>; }
function ListField({ label, values, onChange, ai }: { label: string; values: string[]; onChange: (values: string[]) => void; ai: FieldAiProps }) { return <div className="block"><FieldAiHeader label={label} ai={ai} /><textarea aria-label={label} value={values.join("\n")} onChange={(event) => onChange(lines(event.target.value))} rows={Math.max(7, Math.min(16, values.length + 3))} className="ats-field resize-y" placeholder="One item per line" /><FieldSuggestionPanel suggestion={ai.suggestion} onApply={ai.onApply} onDismiss={ai.onDismiss} /></div>; }

function SectionEditor({ section, resume, setResume, optimizeField, optimizingField, fieldSuggestion, applyFieldSuggestion, dismissFieldSuggestion }: { section: Section; resume: ATSResume; setResume: React.Dispatch<React.SetStateAction<ATSResume>>; optimizeField: (request: FieldOptimizationRequest) => Promise<void>; optimizingField: string; fieldSuggestion: FieldSuggestion | null; applyFieldSuggestion: () => void; dismissFieldSuggestion: () => void }) {
  const set = <Key extends keyof ATSResume>(field: Key, value: ATSResume[Key]) => setResume((current) => ({ ...current, [field]: value }));
  const ai = (request: FieldOptimizationRequest): FieldAiProps => ({ onOptimize: () => void optimizeField(request), loading: optimizingField === request.id, suggestion: fieldSuggestion?.id === request.id ? fieldSuggestion : undefined, onApply: applyFieldSuggestion, onDismiss: dismissFieldSuggestion });
  const stringRequest = (field: "name" | "headline" | "email" | "phone" | "location" | "summary", label: string): FieldOptimizationRequest => ({ id: field, label, before: resume[field], read: (candidate) => candidate[field], apply: (current, value) => ({ ...current, [field]: value }) });
  const listRequest = (field: "skills" | "experience" | "education" | "achievements" | "certifications" | "languages", label: string): FieldOptimizationRequest => ({ id: field, label, before: resume[field].join("\n"), read: (candidate) => candidate[field].join("\n"), apply: (current, value) => ({ ...current, [field]: lines(value) }) });
  if (section === "Personal") return <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" value={resume.name} onChange={(value) => set("name", value)} ai={ai(stringRequest("name", "Full name"))} /><Field label="Professional headline" value={resume.headline} onChange={(value) => set("headline", value)} ai={ai(stringRequest("headline", "Professional headline"))} /><Field label="Email" type="email" value={resume.email} onChange={(value) => set("email", value)} ai={ai(stringRequest("email", "Email"))} /><Field label="Phone" type="tel" value={resume.phone} onChange={(value) => set("phone", value)} ai={ai(stringRequest("phone", "Phone"))} /><div className="sm:col-span-2"><Field label="Location" value={resume.location} onChange={(value) => set("location", value)} ai={ai(stringRequest("location", "Location"))} /></div></div>;
  if (section === "Summary") return <ListField label="Professional summary" values={resume.summary ? [resume.summary] : []} onChange={(value) => set("summary", value.join("\n"))} ai={ai(stringRequest("summary", "Professional summary"))} />;
  if (section === "Skills") return <ListField label="Skills" values={resume.skills} onChange={(value) => set("skills", value)} ai={ai(listRequest("skills", "Skills"))} />;
  if (section === "Experience") return <ListField label="Experience entries or achievement bullets" values={resume.experience} onChange={(value) => set("experience", value)} ai={ai(listRequest("experience", "Experience"))} />;
  if (section === "Education") return <ListField label="Education entries" values={resume.education} onChange={(value) => set("education", value)} ai={ai(listRequest("education", "Education"))} />;
  if (section === "Achievements") return <ListField label="Achievements" values={resume.achievements} onChange={(value) => set("achievements", value)} ai={ai(listRequest("achievements", "Achievements"))} />;
  if (section === "Certifications") return <ListField label="Certifications" values={resume.certifications} onChange={(value) => set("certifications", value)} ai={ai(listRequest("certifications", "Certifications"))} />;
  if (section === "Languages") return <ListField label="Languages" values={resume.languages} onChange={(value) => set("languages", value)} ai={ai(listRequest("languages", "Languages"))} />;
  if (section === "Links") { const values = resume.links.map((link) => `${link.platform} | ${link.url}`); const request: FieldOptimizationRequest = { id: "links", label: "Links", before: values.join("\n"), read: (candidate) => candidate.links.map((link) => `${link.platform} | ${link.url}`).join("\n"), apply: (current, value) => ({ ...current, links: lines(value).map((item) => { const [platform, ...url] = item.split("|"); return { platform: platform.trim() || "Link", url: url.join("|").trim() }; }).filter((link) => link.url) }) }; return <ListField label="Links (Platform | URL)" values={values} onChange={(items) => set("links", items.map((item) => { const [platform, ...url] = item.split("|"); return { platform: platform.trim() || "Link", url: url.join("|").trim() }; }).filter((link) => link.url))} ai={ai(request)} />; }
  return <div className="space-y-5">{resume.projects.map((project, index) => { const updateProject = (current: ATSResume, patch: Partial<ATSResume["projects"][number]>) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }); const nameRequest: FieldOptimizationRequest = { id: `project-${index}-name`, label: `Project ${index + 1} name`, before: project.name, read: (candidate) => candidate.projects[index]?.name || "", apply: (current, value) => updateProject(current, { name: value }) }; const descriptionRequest: FieldOptimizationRequest = { id: `project-${index}-description`, label: `Project ${index + 1} description`, before: project.description, read: (candidate) => candidate.projects[index]?.description || "", apply: (current, value) => updateProject(current, { description: value }) }; const technologyRequest: FieldOptimizationRequest = { id: `project-${index}-technologies`, label: `Project ${index + 1} technologies`, before: project.technologies.join(", "), read: (candidate) => candidate.projects[index]?.technologies.join(", ") || "", apply: (current, value) => updateProject(current, { technologies: value.split(",").map((part) => part.trim()).filter(Boolean) }) }; return <div key={index} className="border border-[#d9d6cd] bg-white p-4"><div className="grid gap-4"><Field label="Project name" value={project.name} onChange={(value) => set("projects", resume.projects.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item))} ai={ai(nameRequest)} /><ListField label="Description" values={project.description ? [project.description] : []} onChange={(value) => set("projects", resume.projects.map((item, itemIndex) => itemIndex === index ? { ...item, description: value.join("\n") } : item))} ai={ai(descriptionRequest)} /><Field label="Technologies (comma separated)" value={project.technologies.join(", ")} onChange={(value) => set("projects", resume.projects.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: value.split(",").map((part) => part.trim()).filter(Boolean) } : item))} ai={ai(technologyRequest)} /></div><button type="button" onClick={() => set("projects", resume.projects.filter((_, itemIndex) => itemIndex !== index))} className="mt-3 text-xs text-red-700">Remove project</button></div>; })}<button type="button" onClick={() => set("projects", [...resume.projects, { name: "", description: "", technologies: [], links: [] }])} className="border border-[#c9b06f] bg-white px-4 py-2 text-xs font-bold text-[#765719] hover:bg-[#fffaf0]">Add project</button></div>;
}

function KeywordList({ title, values, tone }: { title: string; values: string[]; tone: "matched" | "missing" }) { return <div className="mt-4"><p className="ats-label">{title}</p><div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{values.length ? values.map((value) => <span key={value} className={`px-2 py-1 text-[10px] ${tone === "matched" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-100"}`}>{value}</span>) : <span className="text-xs text-[#625d55]">None</span>}</div></div>; }
function ResumePreview({ resume, fullPage = false }: { resume: ATSResume; fullPage?: boolean }) {
  const sectionClass = fullPage ? "mt-7" : "mt-5";
  const headingClass = fullPage ? "text-[11px]" : "text-[10px]";
  const bodyClass = fullPage ? "text-[11px] leading-[1.65]" : "text-[9px] leading-4";
  const list = (title: string, values: string[]) => values.length ? <section className={sectionClass}><h3 className={`border-b border-black/30 pb-1 font-bold uppercase tracking-[.12em] ${headingClass}`}>{title}</h3><ul className={`mt-2 space-y-1 ${bodyClass}`}>{values.map((value, index) => <li key={index}>• {value}</li>)}</ul></section> : null;
  return <article className={`mx-auto bg-[#f4f1e9] text-[#171713] shadow-[0_24px_70px_rgba(0,0,0,.45)] ${fullPage ? "min-h-280.75 w-full max-w-198.5 p-8 sm:p-12 md:p-16" : "min-h-147.5 p-7"}`}>
    <h2 className={`font-serif font-bold ${fullPage ? "text-4xl" : "text-2xl"}`}>{resume.name || "Your Name"}</h2>
    <p className={`mt-1 font-bold ${fullPage ? "text-sm" : "text-xs"}`}>{resume.headline}</p>
    <p className={`mt-1 ${fullPage ? "text-[11px]" : "text-[9px]"}`}>{[resume.email, resume.phone, resume.location].filter(Boolean).join(" | ")}</p>
    {resume.summary && <section className={sectionClass}><h3 className={`border-b border-black/30 pb-1 font-bold uppercase tracking-[.12em] ${headingClass}`}>Professional Summary</h3><p className={`mt-2 whitespace-pre-wrap ${bodyClass}`}>{resume.summary}</p></section>}
    {resume.skills.length > 0 && <section className={sectionClass}><h3 className={`border-b border-black/30 pb-1 font-bold uppercase tracking-[.12em] ${headingClass}`}>Skills</h3><p className={`mt-2 ${bodyClass}`}>{resume.skills.join(" • ")}</p></section>}
    {list("Experience", resume.experience)}{list("Education", resume.education)}
    {resume.projects.length > 0 && <section className={sectionClass}><h3 className={`border-b border-black/30 pb-1 font-bold uppercase tracking-[.12em] ${headingClass}`}>Projects</h3>{resume.projects.map((project, index) => <div key={index} className={`mt-2 ${bodyClass}`}><strong>{project.name}</strong><p>{project.description}</p></div>)}</section>}
    {list("Achievements", resume.achievements)}{list("Certifications", resume.certifications)}{list("Languages", resume.languages)}
  </article>;
}