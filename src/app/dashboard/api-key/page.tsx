"use client";

import { useState } from "react";
import { Check, Clipboard, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeading } from "@/components/dashboard-ui";
import { apiRequest } from "@/lib/api";

export default function ApiKeyPage() {
  const { user } = useAuth();
  const [key, setKey] = useState(user?.apiKey || "");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function retrieve() { try { const data = await apiRequest<{ apiKey: string }>("/api/auth/api-key", { method: "POST" }); setKey(data.apiKey); setRevealed(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to retrieve key"); } }
  async function copy() { if (!key) return; await navigator.clipboard.writeText(key); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  const masked = key ? `sk-like-${"•".repeat(24)}${key.slice(-4)}` : "No key loaded";
  return <><PageHeading eyebrow="Developer access" title="API key" description="Use this key with the configured SmartyAI backend. Treat it like a password and never place it in client-side source code." /><section className="max-w-3xl border border-white/10 bg-[#12120f] p-6 md:p-8"><div className="flex items-center gap-3"><KeyRound className="text-gold" size={20} /><h2 className="font-bold">Existing account key</h2></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 overflow-x-auto border border-white/10 bg-black/30 px-4 py-3 text-xs text-[#d6cfc3]">{revealed ? key : masked}</code><button type="button" onClick={() => key ? setRevealed((value) => !value) : retrieve()} title={key ? (revealed ? "Hide API key" : "Reveal API key") : "Retrieve API key"} className="grid h-11 w-11 shrink-0 place-items-center border border-white/15 text-[#b3ac9f] hover:text-white">{revealed ? <EyeOff size={17} /> : <Eye size={17} />}</button><button type="button" disabled={!key} onClick={copy} title="Copy API key" className="flex h-11 shrink-0 items-center justify-center gap-2 bg-gold px-4 text-xs font-bold text-black disabled:opacity-50">{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied" : "Copy"}</button></div>{error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}<div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2"><div><p className="flex items-center gap-2 text-sm font-bold"><LockKeyhole size={15} className="text-gold" />Rotation unavailable</p><p className="mt-2 text-xs leading-5 text-[#777066]">The backend has no API-key rotation operation.</p></div><div><p className="flex items-center gap-2 text-sm font-bold"><LockKeyhole size={15} className="text-gold" />Revocation unavailable</p><p className="mt-2 text-xs leading-5 text-[#777066]">The backend has no API-key revoke operation.</p></div></div></section></>;
}