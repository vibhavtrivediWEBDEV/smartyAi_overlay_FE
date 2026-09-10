"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, AuthResponse, saveAccessToken } from "@/lib/api";

function getAuthErrorMessage(error: unknown, mode: "login" | "register") {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : "Unable to continue";
  if (mode === "login" && error.status === 401) return "That email or password is incorrect. Check your details and try again.";
  if (error.status === 429) return "Too many attempts. Wait a moment before trying again.";
  if (error.status >= 500) return "The account service is temporarily unavailable. Please try again in a few minutes.";
  return error.message;
}

export function AuthForm({ mode, redirectTo = "/dashboard" }: { mode: "login" | "register"; redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const payload = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ name: data.get("name"), email: data.get("email"), password: data.get("password") }),
      });
      saveAccessToken(payload.token);
      router.push(payload.user.isAdmin ? "/dashboard/admin" : redirectTo);
    } catch (caught) {
      setError(getAuthErrorMessage(caught, mode));
    } finally {
      setSubmitting(false);
    }
  }

  const registering = mode === "register";
  return <main className="luxury-auth hero-grid grid min-h-screen bg-ink text-paper lg:grid-cols-[.85fr_1.15fr]"><section className="luxury-auth-story flex flex-col justify-between border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-12"><Link href="/" className="display-type text-3xl font-bold">Smarty<span className="text-gold">AI</span></Link><div className="my-20 max-w-lg"><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Demo account access</p><h1 className="display-type mt-5 text-6xl font-semibold leading-[.9] tracking-normal md:text-7xl">Explore the account workspace.</h1><p className="mt-7 text-sm leading-7 text-[#9c9589]">This demo can contact the configured backend for account actions. Use test credentials only and do not submit resumes, private conversations, or other sensitive data.</p></div><p className="text-xs text-[#665f55]">Demo bearer sessions are stored in this browser&apos;s localStorage.</p></section><section className="luxury-auth-panel flex items-center justify-center p-6 md:p-12"><div className="luxury-auth-card w-full max-w-md"><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">{registering ? "Create demo account" : "Demo sign in"}</p><h2 className="display-type mt-3 text-5xl font-semibold tracking-normal">{registering ? "Start the preview." : "Continue the preview."}</h2><form className="mt-10 grid gap-5" onSubmit={submit}>{registering && <label className="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#8f887d]">Name<input name="name" required autoComplete="name" className="border border-white/15 bg-[#11110f] px-4 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-gold" /></label>}<label className="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#8f887d]">Email<input name="email" required type="email" autoComplete="email" className="border border-white/15 bg-[#11110f] px-4 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-gold" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#8f887d]">Password<input name="password" required minLength={6} type="password" autoComplete={registering ? "new-password" : "current-password"} className="border border-white/15 bg-[#11110f] px-4 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-gold" /></label>{error && <p role="alert" className="border-l-2 border-red-400 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={submitting} className="mt-2 flex items-center justify-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-black disabled:opacity-60">{submitting ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}{registering ? "Create account" : "Log in"}</button></form><p className="mt-7 text-sm text-[#817a6f]">{registering ? "Already registered?" : "New to SmartyAI?"} <Link className="font-bold text-gold-bright" href={registering ? "/login" : "/register"}>{registering ? "Log in" : "Create an account"}</Link></p></div></section></main>;
}