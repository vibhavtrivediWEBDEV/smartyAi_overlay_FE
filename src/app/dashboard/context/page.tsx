"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { PageHeading } from "@/components/dashboard-ui";
import { ProfileReadme } from "@/components/profile-readme";
import { useAuth } from "@/components/auth-provider";
import { apiRequest, type ProfileContext } from "@/lib/api";

export default function ContextPage() {
  const { user } = useAuth();
  const [context, setContext] = useState<ProfileContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadContext() {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<{ context: ProfileContext }>("/api/profile/context");
      setContext(result.context);
      setInstructions(result.context.customInstructions || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load your profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ context: ProfileContext }>("/api/profile/context")
      .then((result) => { if (active) { setContext(result.context); setInstructions(result.context.customInstructions || ""); } })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load your profile"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveInstructions() {
    setSaving(true); setNotice(""); setError("");
    try {
      await apiRequest("/api/profile/instructions", { method: "PUT", body: JSON.stringify({ customInstructions: instructions }) });
      setNotice("Response preferences saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save response preferences");
    } finally { setSaving(false); }
  }

  return <div className="max-w-295">
    <div className="flex items-start justify-between gap-4">
      <PageHeading eyebrow="User profile" title="Your professional story" description="A living profile built from the experience and context you have shared with SmartyAI." />
      <button type="button" onClick={loadContext} disabled={loading} title="Refresh profile" aria-label="Refresh profile" className="mt-6 grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-[#aaa397] hover:border-gold/40 hover:text-gold disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
    </div>
    {error && <p role="alert" className="mb-5 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</p>}
    <section className="mb-6 border border-white/10 bg-[#12120f] p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-[.13em] text-gold">Custom AI behavior</p><h2 className="mt-3 text-xl font-bold">Response preferences</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8f887d]">Set how answers should sound for behavioral, technical, or other interview questions. Factuality and safety rules always remain active.</p><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={2000} rows={6} placeholder="Example: Use STAR structure for behavioral answers. For coding questions, start with the approach, then provide concise Java code and complexity." className="mt-5 w-full resize-y border border-white/15 bg-black/20 p-4 text-sm leading-6 text-[#d8d1c4] outline-none focus:border-gold/60" /><div className="mt-3 flex items-center justify-between gap-4"><span className="text-xs text-[#777066]">{instructions.length}/2000</span><button type="button" onClick={saveInstructions} disabled={saving} className="flex items-center gap-2 border border-gold/50 px-4 py-2 text-xs font-bold text-gold disabled:opacity-50"><Save size={14} />{saving ? "Saving" : "Save preferences"}</button></div>{notice && <p role="status" className="mt-3 text-xs text-gold">{notice}</p>}</section>
    {loading && !context ? <div className="border border-white/10 bg-[#12120f] p-8 text-sm text-[#8f887d]">Loading your professional story...</div> : context && user ? <ProfileReadme account={user} context={context} /> : null}
  </div>;
}