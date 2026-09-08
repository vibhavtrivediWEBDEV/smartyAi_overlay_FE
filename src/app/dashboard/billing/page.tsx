"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeading, Stat } from "@/components/dashboard-ui";

export default function BillingPage() {
  const { user } = useAuth(); if (!user) return null;
  const payment = user.payment;
  const paidAt = payment?.paidAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(payment.paidAt)) : "Not recorded";
  return <><PageHeading eyebrow="Billing" title="Payment status" description="Your latest verified one-time payment and access details." /><div className="grid gap-3 sm:grid-cols-3"><Stat label="Status" value={payment?.status || "pending"} /><Stat label="Recorded amount" value={payment ? `${payment.currency} ${payment.amount}` : "INR 0"} /><Stat label="Provider" value={payment?.provider || "Not recorded"} /></div><section className="mt-3 border border-white/10 bg-[#12120f] p-6"><dl className="grid gap-6 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#777066]">Plan key</dt><dd className="mt-1 font-bold">{payment?.planKey || user.plan}</dd></div><div><dt className="text-xs text-[#777066]">Paid at</dt><dd className="mt-1 font-bold">{paidAt}</dd></div><div><dt className="text-xs text-[#777066]">Order reference</dt><dd className="mt-1 break-all font-mono text-xs">{payment?.receiptId || "No payment yet"}</dd></div><div><dt className="text-xs text-[#777066]">Verification</dt><dd className="mt-1 font-bold text-gold">{payment?.provider === "razorpay" && payment.status === "paid" ? "Verified by Razorpay" : "Not verified"}</dd></div></dl></section><p className="mt-5 max-w-3xl text-xs leading-5 text-[#777066]">Payments are one-time purchases. SmartyAI does not automatically renew or charge your payment method.</p></>;
}