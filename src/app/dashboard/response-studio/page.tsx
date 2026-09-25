"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, FlaskConical, History, Library, Play, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Preferences = {
  language: string;
  tone: string;
  technicalDepth: number;
  structure: string;
  answerLength: string;
  answerRules: { startWithDirectAnswer: boolean; useRealResumeExamples: boolean; explainAcronyms: boolean };
};
type Example = { id: string; question: string; answer: string; scope: "global" | "similar"; tags: string[]; createdAt: string };
type Tab = "configure" | "ask" | "teach" | "library";

const defaults: Preferences = {
  language: "en", tone: "confident", technicalDepth: 70, structure: "natural", answerLength: "balanced",
  answerRules: { startWithDirectAnswer: true, useRealResumeExamples: true, explainAcronyms: false },
};
const tabs: { id: Tab; title: string; icon: typeof Sparkles }[] = [
  { id: "configure", title: "Configure", icon: Sparkles },
  { id: "ask", title: "Ask & compare", icon: FlaskConical },
  { id: "teach", title: "Teach AI", icon: Check },
  { id: "library", title: "Library & history", icon: History },
];

function matchingExample(question: string, examples: Example[]) {
  const aliases: Record<string, string> = { exp: "experience", yrs: "years", yr: "year", dev: "developer", proj: "project" };
  const terms = new Set((question.toLowerCase().match(/[a-z0-9]{3,}/g) || []).map(term => aliases[term] || term));
  return examples
    .map(example => {
      const exampleTerms = (example.question.toLowerCase().match(/[a-z0-9]{3,}/g) || []).map(term => aliases[term] || term);
      return { example, score: exampleTerms.filter(term => terms.has(term)).length };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)[0]?.example;
}

export default function ResponseStudioPage() {
  const [tab, setTab] = useState<Tab>("configure");
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [guidelines, setGuidelines] = useState("");
  const [dirty, setDirty] = useState(false);
  const [question, setQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [temporaryAnswer, setTemporaryAnswer] = useState("");
  const [preferredAnswer, setPreferredAnswer] = useState("");
  const [scope, setScope] = useState<Example["scope"]>("similar");
  const [tags, setTags] = useState("");
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [profile, library] = await Promise.all([
          apiRequest<{ context: { preferences?: Partial<Preferences>; customInstructions?: string } }>("/api/profile/context"),
          apiRequest<{ examples: Example[] }>("/api/studio/examples"),
        ]);
        const saved = profile.context.preferences || {};
        setPreferences({ ...defaults, ...saved, technicalDepth: Number(saved.technicalDepth ?? 70), answerRules: { ...defaults.answerRules, ...saved.answerRules } });
        setGuidelines(profile.context.customInstructions || "");
        setExamples(library.examples);
      } catch (caught) { setError(message(caught)); }
      finally { setLoading(false); }
    }
    void load();
  }, []);

  function updatePreference(field: keyof Omit<Preferences, "answerRules">, value: string | number) {
    setPreferences(current => ({ ...current, [field]: value }));
    setDirty(true); setNotice("");
  }
  function updateRule(field: keyof Preferences["answerRules"], value: boolean) {
    setPreferences(current => ({ ...current, answerRules: { ...current.answerRules, [field]: value } }));
    setDirty(true); setNotice("");
  }
  async function saveProfile() {
    setBusy("save"); setError(""); setNotice("");
    try {
      await apiRequest("/api/profile/preferences", { method: "PUT", body: JSON.stringify(preferences) });
      await apiRequest("/api/profile/instructions", { method: "PUT", body: JSON.stringify({ customInstructions: guidelines }) });
      setDirty(false); setNotice("Profile saved. New live answers will use these settings.");
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(""); }
  }
  async function ask(compare: boolean) {
    if (!question.trim()) { setError("Enter a question to generate an answer."); return; }
    setBusy(compare ? "compare" : "ask"); setError(""); setNotice("");
    setCurrentAnswer(""); setTemporaryAnswer("");
    try {
      const approved = !compare ? matchingExample(question.trim(), examples) : undefined;
      if (approved) {
        setCurrentAnswer(approved.answer);
        setPreferredAnswer(approved.answer);
        setNotice("Showing your approved Library answer.");
        return;
      }
      const saved = await apiRequest<{ choices: { message: { content: string } }[] }>("/api/studio/ask", {
        method: "POST", body: JSON.stringify({ question: question.trim() }),
      });
      const answer = saved.choices[0]?.message.content || "";
      setCurrentAnswer(answer); setPreferredAnswer(answer);
      if (compare) {
        const temporary = await apiRequest<{ choices: { message: { content: string } }[] }>("/api/studio/ask", {
          method: "POST", body: JSON.stringify({ question: question.trim(), temporary: { preferences, customInstructions: guidelines } }),
        });
        setTemporaryAnswer(temporary.choices[0]?.message.content || "");
      }
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(""); }
  }
  async function approve() {
    if (!question.trim() || !preferredAnswer.trim()) { setError("Add a question and preferred answer before approval."); return; }
    const parsedTags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
    if (parsedTags.length > 8 || parsedTags.some(tag => !/^[\w -]{1,32}$/.test(tag))) { setError("Use up to 8 short tags (letters, numbers, spaces, hyphens)."); return; }
    setBusy("approve"); setError(""); setNotice("");
    try {
      const result = await apiRequest<{ example: Example }>("/api/studio/examples", {
        method: "POST", body: JSON.stringify({ question: question.trim(), answer: preferredAnswer.trim(), scope, tags: parsedTags }),
      });
      setExamples(current => [result.example, ...current]);
      setNotice("Answer approved. It can now guide relevant future responses.");
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(""); }
  }
  async function remove(id: string) {
    setBusy(id); setError("");
    try {
      await apiRequest(`/api/studio/examples/${encodeURIComponent(id)}`, { method: "DELETE" });
      setExamples(current => current.filter(example => example.id !== id));
      setNotice("Example removed from future answer context.");
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(""); }
  }

  if (loading) return <p className="p-8 text-sm text-[#aaa397]">Loading Response Studio...</p>;

  return <div className="max-w-295 space-y-6 text-[#d8d1c4]">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase text-gold">Personalization workspace</p><h1 className="display-type mt-2 text-4xl font-semibold text-white">Response Studio</h1><p className="mt-2 text-sm text-[#aaa397]">Configure, ask, correct, approve, test, improve.</p></div>
      {dirty && <span className="text-xs text-gold">Unsaved draft settings</span>}
    </header>
    <nav aria-label="Response Studio sections" className="flex flex-wrap gap-1 border-b border-white/10">
      {tabs.map(item => <button type="button" key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${tab === item.id ? "border-gold text-white" : "border-transparent text-[#aaa397] hover:text-white"}`}><item.icon size={16} />{item.title}</button>)}
    </nav>
    {error && <p role="alert" className="border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-200">{notice}</p>}

    {tab === "configure" && <div className="space-y-6">
      <section className="border border-white/10 bg-[#12120f] p-6 md:p-8"><h2 className="text-xl font-bold text-white">Response behavior</h2><p className="mt-2 text-sm text-[#aaa397]">These settings shape future live answers after saving. Draft settings can be compared without saving.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Field label="Language"><select className="studio-input" value={preferences.language} onChange={event => updatePreference("language", event.target.value)}><option value="en">English</option><option value="hinglish">Hinglish</option><option value="hi">Hindi</option><option value="es">Spanish</option></select></Field>
          <Field label="Tone"><select className="studio-input" value={preferences.tone} onChange={event => updatePreference("tone", event.target.value)}><option value="confident">Confident and natural</option><option value="friendly">Friendly and conversational</option><option value="formal">Professional and formal</option><option value="direct">Direct and technical</option></select></Field>
          <Field label="Answer length"><select className="studio-input" value={preferences.answerLength} onChange={event => updatePreference("answerLength", event.target.value)}><option value="brief">Brief</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></Field>
          <Field label="Structure"><select className="studio-input" value={preferences.structure} onChange={event => updatePreference("structure", event.target.value)}><option value="natural">Natural conversation</option><option value="star">STAR for behavioral answers</option><option value="definition">Definition then example</option><option value="step">Step by step</option></select></Field>
          <Field label={`Technical depth · ${preferences.technicalDepth}%`}><input type="range" min="0" max="100" value={preferences.technicalDepth} onChange={event => updatePreference("technicalDepth", Number(event.target.value))} className="w-full accent-[#c9a35b]" /></Field>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-white/10 bg-[#12120f] p-6"><h2 className="text-lg font-bold text-white">Answer rules</h2><div className="mt-5 grid gap-3">{([ ["startWithDirectAnswer", "Start with a direct answer"], ["useRealResumeExamples", "Use real resume examples when relevant"], ["explainAcronyms", "Explain acronyms on first use"] ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.answerRules[key]} onChange={event => updateRule(key, event.target.checked)} className="accent-[#c9a35b]" />{label}</label>)}</div></div>
        <div className="border border-white/10 bg-[#12120f] p-6"><Field label="Your guidelines"><textarea className="studio-input min-h-32 resize-y" maxLength={2000} value={guidelines} onChange={event => { setGuidelines(event.target.value); setDirty(true); }} placeholder="Example: Keep explanations easy to say aloud." /></Field><p className="mt-2 text-right text-xs text-[#aaa397]">{guidelines.length}/2000</p></div>
      </section>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => void saveProfile()} disabled={!!busy} className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-ink disabled:opacity-50"><Save size={16} />{busy === "save" ? "Saving..." : "Save profile"}</button><button type="button" onClick={() => setTab("ask")} className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm text-white"><Play size={16} />Test these settings</button><button type="button" title="Reset draft to defaults" aria-label="Reset draft to defaults" onClick={() => { setPreferences(defaults); setGuidelines(""); setDirty(true); }} className="border border-white/20 px-3 text-[#aaa397]"><RotateCcw size={16} /></button></div>
    </div>}

    {(tab === "ask" || tab === "teach") && <div className="space-y-6">
      <section className="border border-white/10 bg-[#12120f] p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-white">Ask SmartyAI</h2><p className="mt-2 text-sm text-[#aaa397]">Real provider answers, using your saved resume and job description. Each generated answer uses chat credits.</p></div><span className="border border-gold/30 px-3 py-1 text-xs text-gold">Live generation</span></div>
        <Field label="Interview question"><textarea className="studio-input min-h-28 resize-y" maxLength={4000} value={question} onChange={event => { setQuestion(event.target.value); setCurrentAnswer(""); setTemporaryAnswer(""); setPreferredAnswer(""); }} placeholder="Tell me about a technical challenge you solved..." /></Field>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={!!busy || !question.trim()} onClick={() => void ask(false)} className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-ink disabled:opacity-50"><Play size={16} />{busy === "ask" ? "Generating..." : "Generate answer"}</button><button type="button" disabled={!!busy || !question.trim()} onClick={() => void ask(true)} className="inline-flex items-center gap-2 border border-gold/50 px-5 py-3 text-sm text-gold disabled:opacity-50"><FlaskConical size={16} />{busy === "compare" ? "Comparing..." : "Compare saved vs draft"}</button></div>
        <p className="mt-3 text-xs text-[#aaa397]">Compare makes two billable requests. Draft settings on Configure are temporary and are never saved by comparing.</p>
      </section>
      {(currentAnswer || temporaryAnswer) && <div className="grid gap-4 lg:grid-cols-2"><Answer label="Saved profile" content={currentAnswer} /><Answer label="Temporary draft" content={temporaryAnswer} empty="Choose Compare to test unsaved settings beside the saved profile." /></div>}
      {tab === "teach" && temporaryAnswer && <button type="button" onClick={() => setPreferredAnswer(temporaryAnswer)} className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-sm text-white"><Check size={16} />Use draft answer as starting point</button>}
      {tab === "teach" && <section className="border border-white/10 bg-[#12120f] p-6 md:p-8"><h2 className="text-xl font-bold text-white">Correct & approve</h2><p className="mt-2 text-sm text-[#aaa397]">Approved answers guide wording for similar questions; they do not replace facts in your resume. To correct experience details, update and sync your resume in the SmartyAI desktop app, then check the synced facts in <Link className="text-gold underline" href="/dashboard/context">User profile</Link> before asking again. The browser Resume builder saves drafts locally only.</p><Field label="Your preferred answer"><textarea className="studio-input min-h-40 resize-y" maxLength={3000} value={preferredAnswer} onChange={event => setPreferredAnswer(event.target.value)} placeholder="Write the answer you want SmartyAI to learn from..." /></Field>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Apply to"><select className="studio-input" value={scope} onChange={event => setScope(event.target.value as Example["scope"])}><option value="similar">Similar questions</option><option value="global">All questions (style reference)</option></select></Field><Field label="Tags (comma separated)"><input className="studio-input" value={tags} onChange={event => setTags(event.target.value)} placeholder="leadership, debugging" /></Field></div>
        <button type="button" onClick={() => void approve()} disabled={!!busy || !question.trim() || !preferredAnswer.trim()} className="mt-5 inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-ink disabled:opacity-50"><Check size={16} />{busy === "approve" ? "Approving..." : "Approve teaching example"}</button>
      </section>}
      {tab === "ask" && currentAnswer && <button type="button" onClick={() => setTab("teach")} className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm text-white"><Check size={16} />Correct this answer</button>}
    </div>}

    {tab === "library" && <section className="space-y-5"><div><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Library size={20} />Approved examples</h2><p className="mt-2 text-sm text-[#aaa397]">Your approval history. Similar examples are selected by matching words in the question and tags; global examples can guide any answer. Deleting one removes it from future context.</p></div>
      {examples.length === 0 ? <p className="border border-white/10 p-8 text-sm text-[#aaa397]">No approved examples yet. Generate an answer in Teach AI, edit it, and approve it here.</p> : <div className="grid gap-4">{examples.map(example => <article key={example.id} className="border border-white/10 bg-[#12120f] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-gold">{example.scope === "global" ? "All questions" : "Similar questions"} · {new Date(example.createdAt).toLocaleString()}</p><h3 className="mt-2 font-semibold text-white">{example.question}</h3></div><button type="button" disabled={!!busy} title="Delete approved example" aria-label={`Delete example: ${example.question}`} onClick={() => void remove(example.id)} className="p-2 text-[#aaa397] hover:text-red-300 disabled:opacity-50"><Trash2 size={17} /></button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{example.answer}</p>{example.tags.length > 0 && <p className="mt-3 text-xs text-[#aaa397]">{example.tags.join(" · ")}</p>}</article>)}</div>}
    </section>}
  </div>;
}

function message(error: unknown) { return error instanceof Error ? error.message : "Request failed"; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-3 block text-xs font-bold uppercase text-[#aaa397]">{label}</span>{children}</label>; }
function Answer({ label, content, empty }: { label: string; content: string; empty?: string }) { return <section className="min-h-40 border border-white/10 bg-[#12120f] p-6"><h3 className="text-xs font-bold uppercase text-gold">{label}</h3><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#e8e2d8]">{content || empty}</p></section>; }
