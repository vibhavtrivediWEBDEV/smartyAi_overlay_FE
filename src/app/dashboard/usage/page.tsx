"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeading, Stat } from "@/components/dashboard-ui";

export default function UsagePage() {
  const { user } = useAuth(); if (!user) return null;
  const percent = user.dailyCreditLimit ? Math.min((user.creditsUsed / user.dailyCreditLimit) * 100, 100) : 0;
  return <><PageHeading eyebrow="Usage" title="Daily credits" description="Credits reset each UTC day. Chat, microphone, and speaker actions cost 2 credits; screenshots cost 4." /><div className="grid gap-3 sm:grid-cols-3"><Stat label="Credits used today" value={user.creditsUsed.toLocaleString()} /><Stat label="Credits remaining" value={user.creditsRemaining.toLocaleString()} /><Stat label="Daily allowance" value={user.dailyCreditLimit.toLocaleString()} /></div><div className="mt-3 border border-white/10 bg-[#12120f] p-6 md:p-8"><div className="flex items-baseline justify-between"><h2 className="font-bold">Today</h2><span className="display-type text-3xl font-semibold">{Math.round(percent)}%</span></div><div className="mt-5 h-2 bg-white/10"><div className="h-full bg-gold" style={{ width: `${percent}%` }} /></div><p className="mt-4 text-xs leading-5 text-[#777066]">ATS improvements remaining this plan: {user.atsOptimizationsRemaining.toLocaleString()}.</p></div></>;
}