"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, ListFilter, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeading, Stat } from "@/components/dashboard-ui";
import { apiRequest } from "@/lib/api";

type Payment = {
  _id: string; razorpayOrderId: string; razorpayPaymentId?: string; amount: number; currency: string;
  planKey: string; status: string; receipt: string; createdAt: string; paidAt?: string; failedAt?: string;
  failureCode?: string; failureDescription?: string; refundedAmount?: number;
  user?: { name?: string; email?: string } | null;
};
type PaymentEvent = {
  _id: string; eventId: string; type: string; status: string; orderId: string; paymentId: string;
  subscriptionId: string; amount: number | null; currency: string; receivedAt: string; processingError?: string;
  details?: { method?: string; errorCode?: string; errorDescription?: string } | null;
};
type AdminBilling = {
  summary: { users: number; payments: Record<string, { count: number; amount: number }> };
  payments: Payment[]; events: PaymentEvent[];
};
type Tab = "payments" | "events";
type PaymentStatusFilter = "all" | "created" | "paid" | "failed" | "partially_refunded" | "refunded";

function dateTime(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AdminBillingPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminBilling | null>(null);
  const [tab, setTab] = useState<Tab>("payments");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try { setData(await apiRequest<AdminBilling>("/api/admin/billing?limit=200")); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load billing data"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user?.isAdmin) void load(); else setLoading(false); }, [user?.isAdmin]);

  function downloadCsv() {
    if (!data) return;
    const header = ["Receipt", "User", "Email", "Plan", "Status", "Amount", "Currency", "Order ID", "Payment ID", "Created", "Failure"];
    const rows = data.payments.map(payment => [payment.receipt, payment.user?.name, payment.user?.email, payment.planKey, payment.status, payment.amount, payment.currency, payment.razorpayOrderId, payment.razorpayPaymentId, payment.createdAt, payment.failureDescription]);
    downloadBlob(new Blob([[header, ...rows].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }), `smartyai-payments-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function downloadReceipt(payment: Payment) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setFontSize(20); pdf.text("SmartyAI Payment Receipt", 18, 22);
    pdf.setFontSize(10); pdf.text("This is a payment receipt, not a GST tax invoice.", 18, 30);
    const lines = [
      ["Receipt", payment.receipt], ["Customer", payment.user?.name || "—"], ["Email", payment.user?.email || "—"],
      ["Plan", payment.planKey], ["Status", payment.status], ["Amount", `${payment.currency} ${payment.amount.toLocaleString("en-IN")}`],
      ["Order ID", payment.razorpayOrderId], ["Payment ID", payment.razorpayPaymentId || "—"], ["Recorded", dateTime(payment.paidAt || payment.createdAt)]
    ];
    lines.forEach(([label, value], index) => { pdf.setFont("helvetica", "bold"); pdf.text(`${label}:`, 18, 45 + index * 9); pdf.setFont("helvetica", "normal"); pdf.text(String(value), 55, 45 + index * 9); });
    downloadBlob(pdf.output("blob"), `${payment.receipt}.pdf`);
  }

  if (!user?.isAdmin) return <div className="border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200"><ShieldAlert className="mb-3" size={22} /><strong>Admin access required.</strong><p className="mt-2 text-red-200/70">This account is not included in the server admin allowlist.</p></div>;
  const paid = data?.summary.payments.paid || { count: 0, amount: 0 };
  const failed = data?.summary.payments.failed || { count: 0, amount: 0 };
  const created = data?.summary.payments.created || { count: 0, amount: 0 };
  const payments = data?.payments.filter(payment => statusFilter === "all" || payment.status === statusFilter) || [];

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHeading eyebrow="Secure administration" title="Billing operations" description="Payments, receipts, webhook delivery outcomes, and one-time plan access in one owner-only workspace." /><div className="flex gap-2"><button type="button" title="Refresh billing data" onClick={() => void load()} disabled={loading} className="border border-white/15 p-2.5 text-[#aaa397] hover:text-white disabled:opacity-40"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button><button type="button" onClick={downloadCsv} disabled={!data} className="flex items-center gap-2 border border-gold/50 px-3 py-2 text-xs font-bold text-gold disabled:opacity-40"><Download size={15} />Export CSV</button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Registered users" value={(data?.summary.users || 0).toLocaleString("en-IN")} /><Stat label="Created payments" value={created.count.toLocaleString("en-IN")} /><Stat label="Paid payments" value={paid.count.toLocaleString("en-IN")} detail={`INR ${paid.amount.toLocaleString("en-IN")}`} /><Stat label="Failed payments" value={failed.count.toLocaleString("en-IN")} /></div>
    {error && <p className="mt-4 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</p>}
    <div className="mt-6 flex border-b border-white/10" role="tablist">{(["payments", "events"] as Tab[]).map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`border-b-2 px-4 py-3 text-xs font-bold capitalize ${tab === item ? "border-gold text-gold" : "border-transparent text-[#777066] hover:text-white"}`}>{item === "events" ? "Webhook logs" : item}</button>)}</div>
    <div className="overflow-x-auto border-x border-b border-white/10 bg-[#12120f]">
      {tab === "payments" && <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><p className="text-xs text-[#777066]">{payments.length.toLocaleString("en-IN")} payment records</p><label className="flex items-center gap-2 text-xs font-bold text-[#aaa397]"><ListFilter size={15} /><span>Status</span><select aria-label="Filter payments by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value as PaymentStatusFilter)} className="border border-white/15 bg-[#0d0d0b] px-3 py-2 text-xs text-white outline-none focus:border-gold"><option value="all">All statuses</option><option value="created">Created</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="partially_refunded">Partially refunded</option><option value="refunded">Refunded</option></select></label></div><table className="min-w-245 w-full text-left text-xs"><thead className="text-[#777066]"><tr>{["Customer", "Plan", "Status", "Amount", "Receipt", "Razorpay IDs", "Recorded", "Failure", ""].map(label => <th key={label} className="border-b border-white/10 px-4 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{payments.map(payment => <tr key={payment._id} className="border-b border-white/5 align-top"><td className="px-4 py-4"><strong>{payment.user?.name || "Unknown"}</strong><span className="mt-1 block text-[#777066]">{payment.user?.email || "No email"}</span></td><td className="px-4 py-4">{payment.planKey}</td><td className="px-4 py-4 font-bold">{payment.status}</td><td className="px-4 py-4">{payment.currency} {payment.amount.toLocaleString("en-IN")}</td><td className="px-4 py-4 font-mono text-[11px]">{payment.receipt}</td><td className="px-4 py-4 font-mono text-[10px]"><span className="block">{payment.razorpayOrderId}</span><span className="mt-1 block text-[#777066]">{payment.razorpayPaymentId || "—"}</span></td><td className="px-4 py-4 text-[#aaa397]">{dateTime(payment.paidAt || payment.failedAt || payment.createdAt)}</td><td className="max-w-52 px-4 py-4 text-red-200/80">{payment.failureDescription || payment.failureCode || "—"}</td><td className="px-4 py-3">{(payment.status === "paid" || payment.status === "refunded") && <button type="button" title="Download payment receipt" onClick={() => void downloadReceipt(payment)} className="p-2 text-gold hover:text-white"><FileDown size={16} /></button>}</td></tr>)}</tbody></table></>}
      {tab === "events" && <table className="min-w-225 w-full text-left text-xs"><thead className="text-[#777066]"><tr>{["Event", "Processing", "Order / payment", "Subscription", "Amount", "Received", "Details"].map(label => <th key={label} className="border-b border-white/10 px-4 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{data?.events.map(event => <tr key={event._id} className="border-b border-white/5 align-top"><td className="px-4 py-4"><strong>{event.type}</strong><span className="mt-1 block font-mono text-[10px] text-[#777066]">{event.eventId}</span></td><td className="px-4 py-4 font-bold">{event.status}</td><td className="px-4 py-4 font-mono text-[10px]"><span className="block">{event.orderId || "—"}</span><span className="mt-1 block text-[#777066]">{event.paymentId || "—"}</span></td><td className="px-4 py-4 font-mono text-[10px]">{event.subscriptionId || "—"}</td><td className="px-4 py-4">{event.amount === null ? "—" : `${event.currency} ${event.amount.toLocaleString("en-IN")}`}</td><td className="px-4 py-4 text-[#aaa397]">{dateTime(event.receivedAt)}</td><td className="max-w-64 px-4 py-4 text-red-200/80">{event.processingError || event.details?.errorDescription || event.details?.method || "—"}</td></tr>)}</tbody></table>}
      {!loading && data && ((tab === "payments" && !payments.length) || (tab === "events" && !data.events.length)) && <p className="p-8 text-sm text-[#777066]">{tab === "payments" && data.payments.length ? "No payments match this status." : "No records yet."}</p>}
    </div>
  </>;
}