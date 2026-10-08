"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronRight, Download, Eye, FileText, LoaderCircle, PencilLine, RefreshCw, Save, Sparkles, Target, Upload, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { apiRequest, type JsonValue, type ProfileContext } from "@/lib/api";
import { assessJobDescription, ATS_SCORE_VERSION, cleanJobDescription, EMPTY_RESUME, resumeFromProfile, resumeFromText, scoreResume, type ATSResume } from "@/lib/ats";
import { downloadResumePdf, downloadResumeTextPdf, extractPdfText } from "@/lib/ats-pdf";

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
  revisedText: string;
  addedTerms: string[];
  skippedTerms: string[];
  verifiedTerms: string[];
  changeNotes: string;
  promptVersion: string;
  beforeScore: number;
  afterScore: number;
};
type ResumeOptimizationResponse = Omit<ResumeOptimization, "beforeScore" | "afterScore" | "addedTerms" | "skippedTerms" | "verifiedTerms" | "missingEvidenceQuestions"> & Partial<Pick<ResumeOptimization, "addedTerms" | "skippedTerms" | "verifiedTerms" | "missingEvidenceQuestions">>;
type FieldOptimizationRequest = {
  id: string;
  label: string;
  before: string;
  targetLine?: string;
  targetIndex?: number;
  read: (resume: ATSResume) => string;
  apply: (resume: ATSResume, value: string) => ATSResume;
};
type FieldSuggestion = FieldOptimizationRequest & { after: string; reason: string; scoreDelta: number; matchedDelta: number; missingDelta: number; missingEvidenceQuestions: string[]; addedTerms: string[]; skippedTerms: string[]; verifiedTerms: string[] };
type CandidateEvidence = { what: string; how: string; result: string };
type TermAnswer = { status: "yes" | "no" | "skip"; evidence: string };

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function termFromQuestion(question: string) {
  return question.match(/^JD asks for (.+?)\. Have you used /i)?.[1] || question;
}

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function isATSResume(value: JsonValue | undefined): value is JsonValue & ATSResume {
  if (!isRecord(value)) return false;
  const stringFields = ["name", "email", "phone", "location", "headline", "summary"];
  const listFields = ["skills", "experience", "education", "achievements", "certifications", "languages"];
  return stringFields.every((field) => typeof value[field] === "string") &&
    listFields.every((field) => Array.isArray(value[field]) && value[field].every((item) => typeof item === "string")) &&
    Array.isArray(value.projects) && value.projects.every((project) => isRecord(project) && typeof project.name === "string" && typeof project.description === "string" && Array.isArray(project.technologies) && project.technologies.every((item) => typeof item === "string") && Array.isArray(project.links) && project.links.every((item) => typeof item === "string")) &&
    Array.isArray(value.links) && value.links.every((link) => isRecord(link) && typeof link.platform === "string" && typeof link.url === "string");
}

function accountResumeFromContext(context: ProfileContext, accountName: string, accountEmail: string): ATSResume {
  const data = context.resume?.data;
  let accountResume = EMPTY_RESUME;
  if (data) {
    if (isATSResume(data)) {
      accountResume = data;
    } else if (typeof data.text === "string" && data.text.trim()) {
      const extracted = resumeFromText(data.text);
      const mapped = resumeFromProfile(data);
      accountResume = {
        ...extracted,
        name: mapped.name || extracted.name,
        email: mapped.email || extracted.email,
        phone: mapped.phone || extracted.phone,
        location: mapped.location || extracted.location,
        headline: mapped.headline || extracted.headline,
        summary: mapped.summary || extracted.summary,
        skills: mapped.skills.length ? mapped.skills : extracted.skills,
        experience: mapped.experience.length ? mapped.experience : extracted.experience,
        education: mapped.education.length ? mapped.education : extracted.education,
        achievements: mapped.achievements.length ? mapped.achievements : extracted.achievements,
        certifications: mapped.certifications.length ? mapped.certifications : extracted.certifications,
        languages: mapped.languages.length ? mapped.languages : extracted.languages,
        links: mapped.links.length ? mapped.links : extracted.links,
      };
    } else {
      accountResume = resumeFromProfile(data);
    }
  }
  return { ...accountResume, name: accountResume.name || accountName, email: accountResume.email || accountEmail };
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
  const { user } = useAuth();
  const [resume, setResume] = useState<ATSResume>(EMPTY_RESUME);
  const [documentText, setDocumentText] = useState("");
  const [documentMode, setDocumentMode] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [section, setSection] = useState<Section>("Personal");
  const [mode, setMode] = useState<WorkspaceMode>("editor");
  const [loading, setLoading] = useState(true);
  const [loadingAccountResume, setLoadingAccountResume] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [fieldSuggestion, setFieldSuggestion] = useState<FieldSuggestion | null>(null);
  const [optimizingField, setOptimizingField] = useState("");
  const [candidateEvidence, setCandidateEvidence] = useState<CandidateEvidence>({ what: "", how: "", result: "" });
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [pendingField, setPendingField] = useState<FieldOptimizationRequest | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, TermAnswer>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ context: ProfileContext }>("/api/profile/context")
      .then(({ context }) => {
        if (!active) return;
        const profileResume = accountResumeFromContext(context, user?.name || "", user?.email || "");
        const savedDraft = context.atsDraft && isATSResume(context.atsDraft.data) ? context.atsDraft.data : null;
        const savedSource = context.atsDraft && typeof context.atsDraft.data.originalDocument === "string" ? context.atsDraft.data.originalDocument : "";
        const profileSource = context.resume && typeof context.resume.data.text === "string" ? context.resume.data.text : "";
        const source = savedSource || profileSource;
        setResume(savedDraft || profileResume);
        setDocumentText(source);
        setDocumentMode(Boolean(source));
        setJobDescription(cleanJobDescription(context.atsDraft?.jobDescription || context.jobDescription?.text || ""));
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your account resume.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.email, user?.name]);

  const score = useMemo(() => scoreResume(resume, jobDescription), [resume, jobDescription]);
  const jobDescriptionAssessment = useMemo(() => assessJobDescription(jobDescription), [jobDescription]);
  const completedSections = useMemo(() => SECTIONS.filter((item) => sectionProgress(item, resume).complete).length, [resume]);
  const profileCompletion = Math.round((completedSections / SECTIONS.length) * 100);
  const saveDraft = async () => {
    setStatus(""); setError("");
    try {
      await apiRequest("/api/profile/resume/ats-draft", { method: "PUT", body: JSON.stringify({ draft: { ...resume, originalDocument: documentText }, jobDescription }) });
      setStatus("ATS draft saved to your SmartyAI account.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the draft."); }
  };
  const loadAccountResume = async () => {
    setLoadingAccountResume(true); setStatus(""); setError("");
    try {
      const { context } = await apiRequest<{ context: ProfileContext }>("/api/profile/context");
      const latest = accountResumeFromContext(context, user?.name || "", user?.email || "");
      const source = context.resume && typeof context.resume.data.text === "string" ? context.resume.data.text : "";
      setResume(latest);
      setDocumentText(source);
      setDocumentMode(Boolean(source));
      setJobDescription(cleanJobDescription(context.jobDescription?.text || ""));
      setOptimization(null); setFieldSuggestion(null);
      setStatus(context.resume ? "Loaded your account resume." : "No account resume is saved yet. Import a PDF or enter your details, then save an ATS draft.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load your account resume."); }
    finally { setLoadingAccountResume(false); }
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
      setDocumentText(text); setDocumentMode(true); setResume(imported); setStatus(`Imported ${file.name}. Text order and existing bullets are retained; review before saving.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The PDF could not be read."); }
    finally { setImporting(false); if (inputRef.current) inputRef.current.value = ""; }
  };
  const optimizeResume = async (evidence = candidateEvidence) => {
    if (!jobDescriptionAssessment.ready) {
      setError(jobDescriptionAssessment.guidance);
      jobDescriptionRef.current?.focus();
      jobDescriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setPendingField(null); setOptimization(null); setOptimizing(true); setError(""); setStatus("");
    try {
      const result = await apiRequest<ResumeOptimizationResponse>("/api/resume/optimize", {
        method: "POST",
        body: JSON.stringify({ resume, jobDescription, evidence }),
      });
      setOptimization({
        ...result,
        missingEvidenceQuestions: Array.isArray(result.missingEvidenceQuestions) ? result.missingEvidenceQuestions : [],
        addedTerms: Array.isArray(result.addedTerms) ? result.addedTerms : [],
        skippedTerms: Array.isArray(result.skippedTerms) ? result.skippedTerms : [],
        verifiedTerms: Array.isArray(result.verifiedTerms) ? result.verifiedTerms : [],
        beforeScore: score.total,
        afterScore: scoreResume(result.optimizedResume, jobDescription).total,
      });
      setShowEvidenceForm(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Resume optimization failed.";
      if (message.toLowerCase().includes("unsupported factual")) {
        setShowEvidenceForm(true);
        setError("Nothing was changed. The review blocked a detail it could not verify. Add the real specifics you can confirm, then retry.");
      } else setError(message);
    } finally { setOptimizing(false); }
  };
  const optimizeField = async (request: FieldOptimizationRequest, evidence = candidateEvidence) => {
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
    setPendingField(request); setOptimizingField(request.id); setFieldSuggestion(null); setError(""); setStatus("");
    try {
      const beforeScore = score;
      const verifiedAnswers = request.id === "summary"
        ? Object.entries(questionAnswers).map(([term, answer]) => ({ term, ...answer }))
        : [];
      const result = await apiRequest<ResumeOptimizationResponse>("/api/resume/optimize", {
        method: "POST",
        body: JSON.stringify({ resume, jobDescription, focusField: request.label, targetField: request.id === "summary" ? "summary" : "", targetLine: request.targetLine, targetLineIndex: request.targetIndex, evidence: request.id === "summary" ? undefined : evidence, verifiedAnswers }),
      });
      const missingEvidenceQuestions = Array.isArray(result.missingEvidenceQuestions) ? result.missingEvidenceQuestions : [];
      const after = request.read(result.optimizedResume);
      if (after.trim() === request.before.trim() && !missingEvidenceQuestions.length && request.id !== "summary") throw new Error(`The AI could not suggest a supported improvement for ${request.label.toLowerCase()}.`);
      const updatedResume = request.apply(resume, after);
      const afterScore = scoreResume(updatedResume, jobDescription);
      const change = result.changes.find((item) => item.after === after);
      const nextAnswers = Object.fromEntries(missingEvidenceQuestions.map((question) => {
        const term = termFromQuestion(question);
        return [term, questionAnswers[term] || { status: "skip", evidence: "" }];
      }));
      setQuestionAnswers(nextAnswers);
      setFieldSuggestion({
        ...request,
        after,
        reason: change?.reason || result.changeNotes || result.summary,
        scoreDelta: afterScore.total - beforeScore.total,
        matchedDelta: afterScore.matchedKeywords.length - beforeScore.matchedKeywords.length,
        missingDelta: afterScore.missingKeywords.length - beforeScore.missingKeywords.length,
        missingEvidenceQuestions,
        addedTerms: Array.isArray(result.addedTerms) ? result.addedTerms : [],
        skippedTerms: Array.isArray(result.skippedTerms) ? result.skippedTerms : [],
        verifiedTerms: Array.isArray(result.verifiedTerms) ? result.verifiedTerms : [],
      });
      setShowEvidenceForm(request.id !== "summary" && after.trim() === request.before.trim());
      if (request.id === "summary" && after.trim() === request.before.trim()) {
        setStatus(result.changeNotes || "The review kept your Summary unchanged. Confirmed terms are listed below if they were not relevant enough to include.");
      } else if (request.id === "summary") {
        setStatus("A revised Summary is ready to review below. Select Apply to field to replace your current Summary.");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : `Unable to improve ${request.label.toLowerCase()}.`;
      if (message.toLowerCase().includes("unsupported factual")) {
        setShowEvidenceForm(request.id !== "summary");
        setError("Nothing was changed. The review blocked a detail it could not verify. Add the real specifics you can confirm, then retry.");
      } else setError(message);
    } finally { setOptimizingField(""); }
  };
  const retryWithEvidence = () => pendingField ? void optimizeField(pendingField, candidateEvidence) : void optimizeResume(candidateEvidence);
  const applyFieldSuggestion = () => {
    if (!fieldSuggestion) return;
    setResume((current) => fieldSuggestion.apply(current, fieldSuggestion.after));
    if (fieldSuggestion.targetLine && documentText) {
      const sourceLines = documentText.split("\n");
      const matchingLines = sourceLines.flatMap((line, index) => line.trim() === fieldSuggestion.targetLine?.trim() ? [index] : []);
      const duplicateOrdinal = fieldSuggestion.targetIndex === undefined ? 0 : resume.experience.slice(0, fieldSuggestion.targetIndex).filter((line) => line.trim() === fieldSuggestion.targetLine?.trim()).length;
      const sourceLineIndex = matchingLines.length === 1 ? matchingLines[0] : matchingLines[duplicateOrdinal] ?? -1;
      if (sourceLineIndex >= 0) {
        const index = sourceLineIndex;
        const indentation = sourceLines[index].match(/^\s*/)?.[0] || "";
        sourceLines[index] = `${indentation}${fieldSuggestion.after}`;
        setDocumentText(sourceLines.join("\n"));
      }
    } else if (fieldSuggestion.id === "summary" && documentText) {
      const sourceLines = documentText.split("\n");
      const headingPattern = /^(professional summary|summary|profile):?$/i;
      const sectionPattern = /^(professional summary|summary|profile|skills|technical skills|experience|work experience|employment|education|projects|achievements|accomplishments|certifications|languages|links):?$/i;
      const headingIndex = sourceLines.findIndex((line) => headingPattern.test(line.trim()));
      if (headingIndex >= 0) {
        let endIndex = sourceLines.findIndex((line, index) => index > headingIndex && sectionPattern.test(line.trim()));
        if (endIndex < 0) endIndex = sourceLines.length;
        const currentSectionText = sourceLines.slice(headingIndex + 1, endIndex).join("\n").trim();
        if (currentSectionText === fieldSuggestion.before.trim()) {
          sourceLines.splice(headingIndex + 1, endIndex - headingIndex - 1, ...fieldSuggestion.after.split("\n"));
          setDocumentText(sourceLines.join("\n"));
        }
      }
    }
    setStatus(`${fieldSuggestion.label} updated. Review the wording, then save your draft.`);
    setFieldSuggestion(null);
  };
  const applyOptimization = () => {
    if (!optimization) return;
    setResume(optimization.optimizedResume);
    setDocumentMode(false);
    setOptimization(null);
    setStatus("ATS optimization applied. Verify every statement before saving or downloading.");
  };

  if (loading) return <div className="grid min-h-[55vh] place-items-center text-sm text-[#8f887d]"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Loading resume workspace...</div>;
  return <div className="mx-auto max-w-[1680px]">
    <header className="mb-5 border-b border-white/10 pb-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-gold"><span className="h-1.5 w-1.5 bg-emerald-400" />Resume workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#eee9df]">Your resume</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8f887d]">Edit your experience, review suggestions, and keep every claim grounded in what you actually did.</p>
        </div>
        <div className="flex items-center gap-3 border-l-2 border-gold/60 pl-4 lg:min-w-56">
          <Target className="shrink-0 text-gold" size={20} strokeWidth={1.6} />
          <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8f887d]">{score.jobDescriptionReady ? "Target role fit" : "Resume readiness"}</p><p className="mt-0.5 text-lg font-semibold text-[#eee9df]">{score.total}<span className="ml-1 text-xs font-normal text-[#777066]">/100</span><span className="ml-2 text-xs font-normal text-[#8f887d]">{score.jobDescriptionReady ? `${score.matchedKeywords.length} matched` : "Add a job description"}</span></p></div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex h-10 shrink-0 border border-white/15 bg-[#090908] p-1" role="group" aria-label="Resume workspace mode">
            <ModeButton active={mode === "editor"} icon={PencilLine} label="Edit" onClick={() => setMode("editor")} />
            <ModeButton active={mode === "view"} icon={Eye} label="Preview" onClick={() => setMode("view")} />
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void importPdf(event.target.files?.[0])} />
          <ToolbarButton icon={importing ? LoaderCircle : Upload} label={importing ? "Reading PDF..." : "Import PDF"} onClick={() => inputRef.current?.click()} disabled={importing} />
          <ToolbarButton icon={loadingAccountResume ? LoaderCircle : RefreshCw} label={loadingAccountResume ? "Loading..." : "Reload original"} onClick={() => void loadAccountResume()} disabled={loadingAccountResume} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void saveDraft()} className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-white/15 px-3 text-xs font-bold text-[#c8c1b5] hover:border-gold/50 hover:text-gold sm:flex-none"><Save size={14} />Save draft</button>
          <button type="button" onClick={() => void optimizeResume()} disabled={optimizing} className="inline-flex h-10 flex-1 items-center justify-center gap-2 bg-gold px-4 text-xs font-bold text-ink hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">{optimizing ? <LoaderCircle className="animate-spin" size={15} /> : <Sparkles size={15} />}{optimizing ? "Reviewing..." : "Review resume"}</button>
          <button type="button" title="Export resume as PDF" aria-label="Export resume as PDF" onClick={() => documentMode && documentText ? downloadResumeTextPdf(documentText, resume.name) : downloadResumePdf(resume)} className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-[#c8c1b5] hover:border-gold/50 hover:text-gold"><Download size={16} /></button>
        </div>
      </div>
    </header>
    {(status || error) && <div role={error ? "alert" : "status"} className={`mb-5 border p-3 text-sm ${error ? "border-red-400/25 bg-red-400/5 text-red-300" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"}`}>{error || status}</div>}
    {showEvidenceForm && <section className="mb-5 border border-gold/30 bg-[#12120f] p-5" aria-labelledby="evidence-title"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Your facts, your words</p><h2 id="evidence-title" className="mt-1 text-base font-semibold text-[#eee9df]">Add details you can stand behind</h2><p className="mt-1 text-xs leading-5 text-[#8f887d]">Required: what you did. Method and outcome help. Leave anything unknown blank; no metrics will be guessed.</p></div><button type="button" title="Close evidence form" onClick={() => setShowEvidenceForm(false)} className="p-1 text-[#8f887d] hover:text-white"><X size={16} /></button></div><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-[11px] font-bold text-[#c8c1b5]">What you did · Required<textarea value={candidateEvidence.what} onChange={(event) => setCandidateEvidence((current) => ({ ...current, what: event.target.value }))} rows={3} maxLength={2000} placeholder="Start with an action + object" className="ats-field mt-2 w-full resize-y font-normal" /></label><label className="text-[11px] font-bold text-[#c8c1b5]">How you did it · Recommended<textarea value={candidateEvidence.how} onChange={(event) => setCandidateEvidence((current) => ({ ...current, how: event.target.value }))} rows={3} maxLength={2000} placeholder="Tools, methods, decisions, scope" className="ats-field mt-2 w-full resize-y font-normal" /></label><label className="text-[11px] font-bold text-[#c8c1b5]">What changed · Optional<textarea value={candidateEvidence.result} onChange={(event) => setCandidateEvidence((current) => ({ ...current, result: event.target.value }))} rows={3} maxLength={2000} placeholder="A verified result, or leave blank" className="ats-field mt-2 w-full resize-y font-normal" /></label></div><div className="mt-4 flex justify-end"><button type="button" onClick={retryWithEvidence} disabled={optimizing || Boolean(optimizingField) || !candidateEvidence.what.trim()} className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-xs font-bold text-ink hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={14} />{optimizing || optimizingField ? "Reviewing..." : "Review with these facts"}</button></div></section>}
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
        <div className="min-h-111.5 p-5 md:p-8">
          {documentText && <div className="mb-5 flex items-center gap-1 border-b border-[#d9d6cd] pb-3" role="group" aria-label="Resume editing format">
            <button type="button" aria-pressed={documentMode} onClick={() => setDocumentMode(true)} className={`px-3 py-2 text-xs font-bold ${documentMode ? "bg-[#171713] text-white" : "text-[#6c665c] hover:bg-black/5"}`}>Original text</button>
            <button type="button" aria-pressed={!documentMode} onClick={() => setDocumentMode(false)} className={`px-3 py-2 text-xs font-bold ${!documentMode ? "bg-[#171713] text-white" : "text-[#6c665c] hover:bg-black/5"}`}>Structured fields</button>
            {documentMode && <span className="ml-auto text-[10px] text-[#777066]">Line order and bullets retained; PDF typography may differ.</span>}
          </div>}
          {documentMode && documentText ? <textarea aria-label="Original resume text" value={documentText} onChange={(event) => { setDocumentText(event.target.value); setResume(resumeFromText(event.target.value)); }} className="ats-field min-h-111.5 w-full resize-y font-mono text-xs leading-6" spellCheck={false} /> : <SectionEditor section={section} resume={resume} setResume={setResume} optimizeField={optimizeField} optimizingField={optimizingField} fieldSuggestion={fieldSuggestion} applyFieldSuggestion={applyFieldSuggestion} dismissFieldSuggestion={() => setFieldSuggestion(null)} questionAnswers={questionAnswers} onQuestionAnswerChange={(term, answer) => setQuestionAnswers((current) => ({ ...current, [term]: answer }))} />}
        </div>
        <div className="flex items-center justify-between border-t border-[#d9d6cd] bg-white px-5 py-3 text-[11px] text-[#777066] md:px-7"><span>Save your changes to keep this ATS draft in your account.</span><button type="button" onClick={() => setSection(SECTIONS[Math.min(SECTIONS.indexOf(section) + 1, SECTIONS.length - 1)])} className="inline-flex items-center gap-1 font-bold text-[#8b6823]">Next section <ChevronRight size={13} /></button></div>
      </main>
      <aside className="ats-analysis-panel min-w-0 space-y-4 xl:col-span-2">
        <section className="border border-white/10 bg-[#12120f] p-5">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]">{score.jobDescriptionReady ? "Target fit score" : "Resume health"} · {ATS_SCORE_VERSION}</p><p className="mt-2 text-xs leading-5 text-[#777066]">{score.jobDescriptionReady ? "Measured against the pasted role." : "General quality until a full job description is ready."}</p></div><div className="relative grid h-21 w-21 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#e6c57a ${score.total * 3.6}deg, #2b2924 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-[#12120f]"><span className="text-xl font-bold">{score.total}<span className="text-[10px] text-[#777066]">/100</span></span></div></div></div>
        </section>
        <section className="border border-white/10 bg-[#12120f] p-5">
          <div className="flex items-center justify-between gap-3"><label className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8f887d]" htmlFor="job-description">Target job description</label><span className={`text-[10px] font-bold ${jobDescriptionAssessment.ready ? "text-emerald-300" : "text-amber-200"}`}>{jobDescriptionAssessment.ready ? "Ready" : `${jobDescriptionAssessment.wordCount} words`}</span></div>
          <textarea ref={jobDescriptionRef} id="job-description" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setError(""); }} onBlur={() => setJobDescription(cleanJobDescription(jobDescription))} onPaste={(event) => { event.preventDefault(); setJobDescription(cleanJobDescription(event.clipboardData.getData("text"))); }} rows={7} placeholder="Paste the responsibilities, qualifications, and requirements for one target role..." className={`ats-field mt-3 resize-y ${jobDescription.trim() && !jobDescriptionAssessment.ready ? "border-amber-300/50" : ""}`} />
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
        <div className="overflow-x-auto pb-2">{documentMode && documentText ? <pre className="mx-auto min-h-280.75 w-full max-w-198.5 whitespace-pre-wrap bg-[#f4f1e9] p-8 font-mono text-[11px] leading-[1.65] text-[#171713] shadow-[0_24px_70px_rgba(0,0,0,.45)] sm:p-12 md:p-16">{documentText}</pre> : <ResumePreview resume={resume} fullPage />}</div>
      </section>
      <aside className="space-y-5 xl:sticky xl:top-5">
        <section className="border border-white/10 bg-[#10100e] p-5"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#777066]">{jobDescription.trim() ? "Job-fit readiness" : "General readiness"} · {ATS_SCORE_VERSION}</p><p className="display-type mt-2 text-5xl font-semibold">{score.total}<span className="text-lg text-[#777066]">/100</span></p></div><span className={`mb-2 h-3 w-3 ${score.total >= 75 ? "bg-emerald-400" : score.total >= 50 ? "bg-amber-400" : "bg-red-400"}`} /></div><p className="mt-3 text-xs leading-5 text-[#777066]">A transparent readiness estimate, not a hiring guarantee.</p></section>
        <section className="border border-white/10 bg-[#12120f] p-5"><label className="ats-label" htmlFor="view-job-description">Target job description</label><textarea id="view-job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} onBlur={() => setJobDescription(cleanJobDescription(jobDescription))} onPaste={(event) => { event.preventDefault(); setJobDescription(cleanJobDescription(event.clipboardData.getData("text"))); }} rows={7} placeholder="Paste one target job description..." className="ats-field resize-y" /><p className="mt-2 text-[11px] text-[#777066]">{score.matchedKeywords.length} matched · {score.missingKeywords.length} missing</p><KeywordList title="Matched" values={score.matchedKeywords} tone="matched" /><KeywordList title="Missing" values={score.missingKeywords} tone="missing" /></section>
        <section className="border border-white/10 bg-[#12120f] p-5"><p className="ats-label">Priority improvements</p><div className="space-y-2">{score.suggestions.slice(0, 5).map((suggestion) => <p key={suggestion} className="border-l border-gold/50 pl-3 text-xs leading-5 text-[#aaa397]">{suggestion}</p>)}</div></section>
      </aside>
    </div>}
    {optimization && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 md:p-8"><div role="dialog" aria-modal="true" aria-labelledby="optimization-title" className="mx-auto w-full max-w-4xl border border-white/15 bg-[#151411] p-5 shadow-2xl md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Dedicated resume agent · {optimization.promptVersion}</p><h2 id="optimization-title" className="mt-1 text-xl font-bold">ATS optimization review</h2><p className="mt-1 text-xs text-[#8f887d]">Target: {optimization.targetRole || "Role detected from job description"}</p></div><button type="button" title="Close" onClick={() => setOptimization(null)} className="p-2 text-[#8f887d] hover:text-white"><X size={18} /></button></div><div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><div className="bg-[#10100e] p-4"><p className="ats-label">Before</p><p className="text-3xl font-bold">{optimization.beforeScore}<span className="text-sm text-[#777066]">/100</span></p></div><div className="bg-[#10100e] p-4"><p className="ats-label">After</p><p className="text-3xl font-bold text-emerald-300">{optimization.afterScore}<span className="text-sm text-[#777066]">/100</span></p><p className={`mt-1 text-xs ${optimization.afterScore > optimization.beforeScore ? "text-emerald-300" : "text-amber-200"}`}>{optimization.afterScore > optimization.beforeScore ? `+${optimization.afterScore - optimization.beforeScore} deterministic points` : "No deterministic score increase; review evidence gaps below"}</p></div></div><p className="mt-4 text-sm leading-6 text-[#aaa397]">{optimization.summary}</p><div className="mt-5 max-h-[42vh] space-y-3 overflow-y-auto pr-2">{optimization.changes.map((change, index) => <div key={`${change.section}-${index}`} className="border-l-2 border-gold/50 pl-4"><p className="text-[10px] font-bold uppercase text-gold">{change.section}</p><p className="mt-1 text-xs leading-5 text-[#777066] line-through">{change.before}</p><p className="mt-1 text-sm leading-6 text-white">{change.after}</p><p className="mt-1 text-xs text-[#8f887d]">{change.reason}</p></div>)}</div>{optimization.prioritizedKeywords.length > 0 && <p className="mt-5 text-xs leading-5 text-[#aaa397]"><strong className="text-white">Prioritized:</strong> {optimization.prioritizedKeywords.join(", ")}</p>}{optimization.missingEvidenceQuestions.length > 0 && <div className="mt-4 border border-amber-300/20 bg-amber-300/4 p-4"><p className="text-xs font-bold text-amber-200">Evidence needed before claiming these requirements</p>{optimization.missingEvidenceQuestions.map((question) => <p key={question} className="mt-2 text-xs leading-5 text-[#c9bfae]">{question}</p>)}</div>}<div className="mt-6 flex justify-end gap-2"><ToolbarButton icon={X} label="Reject" onClick={() => setOptimization(null)} /><button type="button" onClick={applyOptimization} className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-xs font-bold text-ink"><Check size={15} />Apply optimized resume</button></div></div></div>}
  </div>;
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Eye; label: string; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`inline-flex items-center gap-2 px-3 text-xs font-bold transition ${active ? "bg-paper text-ink" : "text-[#8f887d] hover:text-white"}`}><Icon size={14} />{label}</button>; }
function ToolbarButton({ icon: Icon, label, onClick, disabled }: { icon: typeof Save; label: string; onClick: () => void; disabled?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-10 items-center gap-2 border border-white/15 px-3 text-xs font-bold text-[#aaa397] hover:border-white/30 hover:text-white disabled:opacity-50"><Icon size={15} className={label.includes("...") ? "animate-spin" : ""} />{label}</button>; }
type FieldAiProps = {
  onOptimize: () => void;
  loading: boolean;
  suggestion?: FieldSuggestion;
  onApply: () => void;
  onDismiss: () => void;
  answers: Record<string, TermAnswer>;
  onAnswerChange: (term: string, answer: TermAnswer) => void;
  onRegenerate: () => void;
};
function FieldAiHeader({ label, ai }: { label: string; ai: FieldAiProps }) { return <span className="mb-2 flex items-center justify-between gap-3"><span className="ats-label mb-0!">{label}</span><button type="button" onClick={ai.onOptimize} disabled={ai.loading} title={`Improve ${label} with AI`} className="inline-flex h-7 items-center gap-1.5 border border-[#c9b06f] bg-[#fffdf7] px-2.5 text-[10px] font-bold text-[#765719] transition hover:border-[#8b6823] hover:bg-[#f7eed5] disabled:cursor-wait disabled:opacity-60">{ai.loading ? <LoaderCircle className="animate-spin" size={12} /> : <Sparkles size={12} />}{ai.loading ? "Thinking" : "Improve"}</button></span>; }
function FieldSuggestionPanel({ ai }: { ai: FieldAiProps }) {
  const suggestion = ai.suggestion;
  if (!suggestion) return null;
  const hasChange = suggestion.after.trim() !== suggestion.before.trim();
  const missingEvidenceQuestions = Array.isArray(suggestion.missingEvidenceQuestions) ? suggestion.missingEvidenceQuestions : [];
  const verifiedTerms = Array.isArray(suggestion.verifiedTerms) ? suggestion.verifiedTerms : [];
  const skippedTerms = Array.isArray(suggestion.skippedTerms) ? suggestion.skippedTerms : [];
  const appliedTerms = Array.isArray(suggestion.addedTerms) ? suggestion.addedTerms : [];
  const yesAnswers = Object.entries(ai.answers).filter(([, answer]) => answer.status === "yes" && answer.evidence.trim());
  return <div className="mt-2 border border-[#d5c38f] bg-[#fffaf0] p-3">
    <div className="flex items-start justify-between gap-3"><div>
      <div className="flex items-center gap-2"><p className="text-[9px] font-bold uppercase text-[#8b6823]">{hasChange ? "Suggested revision" : "Details needed"}</p>{hasChange && <span className="bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">{suggestion.scoreDelta > 0 ? `+${suggestion.scoreDelta} ATS` : "Review"}</span>}</div>
      {hasChange && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#27231c]">{suggestion.after}</p>}
    </div><button type="button" onClick={ai.onDismiss} title="Dismiss suggestion" className="shrink-0 p-1 text-[#8c8375] hover:text-black"><X size={14} /></button></div>
    {suggestion.id === "summary" && missingEvidenceQuestions.length > 0 && <div className="mt-3 space-y-3">
      <p className="text-[10px] font-bold text-[#756d61]">Confirm only what you have actually used:</p>
      {missingEvidenceQuestions.map((question) => {
        const term = termFromQuestion(question);
        const answer = ai.answers[term] || { status: "skip" as const, evidence: "" };
        return <div key={term} className="border-t border-[#e3dac6] pt-3">
          <p className="text-xs font-semibold leading-5 text-[#27231c]">{question}</p>
          <div className="mt-2 flex gap-1" role="group" aria-label={`Have you used ${term}?`}>
            {(["yes", "no", "skip"] as const).map((status) => <button key={status} type="button" aria-pressed={answer.status === status} onClick={() => ai.onAnswerChange(term, { ...answer, status })} className={`h-7 border px-3 text-[10px] font-bold uppercase ${answer.status === status ? status === "yes" ? "border-emerald-700 bg-emerald-700 text-white" : status === "no" ? "border-red-800 bg-red-800 text-white" : "border-[#171713] bg-[#171713] text-white" : "border-[#d8d0c0] text-[#655e52] hover:border-[#8b6823]"}`}>{status}</button>)}
          </div>
          {answer.status === "yes" && <label className="mt-2 block text-[10px] font-semibold text-[#756d61]">Where/how did you use {term}?
            <textarea value={answer.evidence} onChange={(event) => ai.onAnswerChange(term, { ...answer, evidence: event.target.value })} rows={2} maxLength={2000} placeholder="Project, role, or task where you used it" className="ats-field mt-1 w-full resize-y text-xs font-normal" />
          </label>}
        </div>;
      })}
      <button type="button" onClick={ai.onRegenerate} disabled={ai.loading || yesAnswers.length === 0} className="inline-flex h-9 items-center gap-2 bg-[#171713] px-3 text-[10px] font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">{ai.loading ? <LoaderCircle className="animate-spin" size={13} /> : <Sparkles size={13} />}Regenerate with my answers</button>
    </div>}
    {verifiedTerms.length > 0 && <p className="mt-3 text-[10px] leading-4 text-emerald-800">Verified in your answers: {verifiedTerms.join(", ")}</p>}
    {appliedTerms.length > 0 && <p className="mt-1 text-[10px] leading-4 text-emerald-800">Included in this revision: {appliedTerms.join(", ")}</p>}
    {skippedTerms.length > 0 && <p className="mt-1 text-[10px] leading-4 text-[#756d61]">Not added to the Summary: {skippedTerms.join(", ")}</p>}
    {suggestion.id === "summary" && !hasChange && <p className="mt-2 text-xs font-semibold text-amber-800">No Summary text changed. Review the confirmed terms above; add more specific evidence or edit the Summary directly.</p>}
    {suggestion.id === "summary" && <p className="mt-2 text-[10px] leading-4 text-[#756d61]">Score after this revision: {suggestion.scoreDelta >= 0 ? "+" : ""}{suggestion.scoreDelta} overall · {suggestion.matchedDelta >= 0 ? "+" : ""}{suggestion.matchedDelta} matched · {suggestion.missingDelta > 0 ? "+" : ""}{suggestion.missingDelta} missing</p>}
    <p className="mt-2 text-[10px] leading-4 text-[#756d61]">{suggestion.reason}</p>
    {hasChange && <button type="button" onClick={ai.onApply} className="mt-3 inline-flex h-8 items-center gap-1.5 bg-[#171713] px-3 text-[10px] font-bold text-white hover:bg-black"><Check size={13} />Apply to field</button>}
  </div>;
}
function Field({ label, value, onChange, type = "text", ai }: { label: string; value: string; onChange: (value: string) => void; type?: string; ai: FieldAiProps }) { return <div className="block"><FieldAiHeader label={label} ai={ai} /><input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="ats-field" /><FieldSuggestionPanel ai={ai} /></div>; }
function ListField({ label, values, onChange, ai }: { label: string; values: string[]; onChange: (values: string[]) => void; ai: FieldAiProps }) { return <div className="block"><FieldAiHeader label={label} ai={ai} /><textarea aria-label={label} value={values.join("\n")} onChange={(event) => onChange(lines(event.target.value))} rows={Math.max(7, Math.min(16, values.length + 3))} className="ats-field resize-y" placeholder="One item per line" /><FieldSuggestionPanel ai={ai} /></div>; }

function SectionEditor({ section, resume, setResume, optimizeField, optimizingField, fieldSuggestion, applyFieldSuggestion, dismissFieldSuggestion, questionAnswers, onQuestionAnswerChange }: { section: Section; resume: ATSResume; setResume: React.Dispatch<React.SetStateAction<ATSResume>>; optimizeField: (request: FieldOptimizationRequest) => Promise<void>; optimizingField: string; fieldSuggestion: FieldSuggestion | null; applyFieldSuggestion: () => void; dismissFieldSuggestion: () => void; questionAnswers: Record<string, TermAnswer>; onQuestionAnswerChange: (term: string, answer: TermAnswer) => void }) {
  const set = <Key extends keyof ATSResume>(field: Key, value: ATSResume[Key]) => setResume((current) => ({ ...current, [field]: value }));
  const ai = (request: FieldOptimizationRequest): FieldAiProps => ({ onOptimize: () => void optimizeField(request), loading: optimizingField === request.id, suggestion: fieldSuggestion?.id === request.id ? fieldSuggestion : undefined, onApply: applyFieldSuggestion, onDismiss: dismissFieldSuggestion, answers: questionAnswers, onAnswerChange: onQuestionAnswerChange, onRegenerate: () => void optimizeField(request) });
  const stringRequest = (field: "name" | "headline" | "email" | "phone" | "location" | "summary", label: string): FieldOptimizationRequest => ({ id: field, label, before: resume[field], read: (candidate) => candidate[field], apply: (current, value) => ({ ...current, [field]: value }) });
  const listRequest = (field: "skills" | "experience" | "education" | "achievements" | "certifications" | "languages", label: string): FieldOptimizationRequest => ({ id: field, label, before: resume[field].join("\n"), read: (candidate) => candidate[field].join("\n"), apply: (current, value) => ({ ...current, [field]: lines(value) }) });
  if (section === "Personal") return <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" value={resume.name} onChange={(value) => set("name", value)} ai={ai(stringRequest("name", "Full name"))} /><Field label="Professional headline" value={resume.headline} onChange={(value) => set("headline", value)} ai={ai(stringRequest("headline", "Professional headline"))} /><Field label="Email" type="email" value={resume.email} onChange={(value) => set("email", value)} ai={ai(stringRequest("email", "Email"))} /><Field label="Phone" type="tel" value={resume.phone} onChange={(value) => set("phone", value)} ai={ai(stringRequest("phone", "Phone"))} /><div className="sm:col-span-2"><Field label="Location" value={resume.location} onChange={(value) => set("location", value)} ai={ai(stringRequest("location", "Location"))} /></div></div>;
  if (section === "Summary") return <ListField label="Professional summary" values={resume.summary ? [resume.summary] : []} onChange={(value) => set("summary", value.join("\n"))} ai={ai(stringRequest("summary", "Professional summary"))} />;
  if (section === "Skills") return <ListField label="Skills" values={resume.skills} onChange={(value) => set("skills", value)} ai={ai(listRequest("skills", "Skills"))} />;
  if (section === "Experience") return <div className="space-y-4">{resume.experience.map((entry, index) => {
    const request: FieldOptimizationRequest = {
      id: `experience-${index}`,
      label: `Experience line ${index + 1}`,
      before: entry,
      targetLine: entry,
      targetIndex: index,
      read: (candidate) => candidate.experience[index] || "",
      apply: (current, value) => ({ ...current, experience: current.experience.map((line, lineIndex) => lineIndex === index ? value : line) }),
    };
    const fieldAi = ai(request);
    return <div key={`${index}-${entry.slice(0, 24)}`} className="border-b border-[#d9d6cd] pb-4 last:border-0"><FieldAiHeader label={request.label} ai={fieldAi} /><textarea aria-label={request.label} value={entry} onChange={(event) => set("experience", resume.experience.map((line, lineIndex) => lineIndex === index ? event.target.value : line))} rows={Math.max(2, Math.min(5, Math.ceil(entry.length / 90)))} className="ats-field w-full resize-y" /><FieldSuggestionPanel ai={fieldAi} /></div>;
  })}{resume.experience.length === 0 && <p className="text-sm text-[#777066]">No experience lines yet. Add one truthful line to start a review.</p>}</div>;
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
  const list = (title: string, values: string[]) => values.length ? <section className={sectionClass}><h3 className={`border-b border-black/30 pb-1 font-bold uppercase tracking-[.12em] ${headingClass}`}>{title}</h3><ul className={`mt-2 space-y-1 ${bodyClass}`}>{values.map((value, index) => <li key={index}>{/^[•*-]\s/.test(value) ? value : `• ${value}`}</li>)}</ul></section> : null;
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