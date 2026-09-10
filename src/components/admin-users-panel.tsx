"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeading, Stat } from "@/components/dashboard-ui";
import { apiRequest, LAUNCH_PLANS } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  planKey: string;
  planExpiresAt: string | null;
  accessStatus: "active" | "expired" | "inactive";
  payment: {
    status: string;
    amount: number;
    currency: string;
    provider: string;
    paidAt: string | null;
    receiptId: string;
  };
  usage: {
    creditsUsed: number;
    creditsRemaining: number;
    dailyCreditLimit: number;
    creditDay: string | null;
    lastRecordedCreditsUsed: number;
    currentUsageDay: string;
    atsOptimizationsUsed: number;
    atsOptimizationsRemaining: number;
  };
  createdAt: string | null;
  lastLoginAt: string | null;
};

type AdminUsersResponse = {
  summary: {
    total: number;
    active: number;
    expired: number;
    inactive: number;
    creditsUsedToday: number;
    usersActiveToday: number;
    exhausted: number;
    atsOptimizationsUsed: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
  users: AdminUser[];
};

function dateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function planName(planKey: string) {
  return LAUNCH_PLANS.find(plan => plan.key === planKey)?.name || planKey;
}

function statusClass(status: AdminUser["accessStatus"]) {
  if (status === "active") return "text-emerald-300";
  if (status === "expired") return "text-red-200";
  return "text-[#8f887d]";
}

export function AdminUsersPanel({ mode }: { mode: "users" | "usage" }) {
  const { user } = useAuth();
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const deferredQuery = useDeferredValue(query.trim());

  async function load() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (deferredQuery) params.set("search", deferredQuery);
    if (planFilter !== "all") params.set("plan", planFilter);
    if (accessFilter !== "all") params.set("access", accessFilter);
    if (mode === "usage" && usageFilter !== "all") params.set("usage", usageFilter);
    try {
      setData(await apiRequest<AdminUsersResponse>(`/api/admin/users?${params}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.isAdmin) void load();
    else setLoading(false);
  }, [user?.isAdmin, deferredQuery, planFilter, accessFilter, usageFilter, page, pageSize, mode]);

  if (!user?.isAdmin) return <div className="border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200"><ShieldAlert className="mb-3" size={22} /><strong>Admin access required.</strong><p className="mt-2 text-red-200/70">This account is not included in the server admin allowlist.</p></div>;

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const firstRecord = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  function resetPage(action: () => void) {
    setPage(1);
    action();
  }

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeading
        eyebrow="Secure administration"
        title={mode === "users" ? "User accounts" : "Usage monitoring"}
        description={mode === "users" ? "Review every account, plan assignment, payment state, access window, and login activity." : "Track used and remaining daily credits plus ATS optimization usage across customer accounts."}
      />
      <button type="button" title="Refresh user data" onClick={() => void load()} disabled={loading} className="border border-white/15 p-2.5 text-[#aaa397] hover:text-white disabled:opacity-40"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
    </div>

    {mode === "users" ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Matching users" value={(data?.summary.total || 0).toLocaleString("en-IN")} />
      <Stat label="Active access" value={(data?.summary.active || 0).toLocaleString("en-IN")} />
      <Stat label="Expired access" value={(data?.summary.expired || 0).toLocaleString("en-IN")} />
      <Stat label="Inactive access" value={(data?.summary.inactive || 0).toLocaleString("en-IN")} />
    </div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Credits used today" value={(data?.summary.creditsUsedToday || 0).toLocaleString("en-IN")} />
      <Stat label="Users active today" value={(data?.summary.usersActiveToday || 0).toLocaleString("en-IN")} />
      <Stat label="Daily limit reached" value={(data?.summary.exhausted || 0).toLocaleString("en-IN")} />
      <Stat label="ATS optimizations" value={(data?.summary.atsOptimizationsUsed || 0).toLocaleString("en-IN")} />
    </div>}

    {error && <p className="mt-4 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</p>}

    <div className="mt-6 flex flex-wrap gap-3 border border-white/10 bg-[#12120f] p-4">
      <label className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 text-[#777066]" size={16} /><span className="sr-only">Search users</span><input type="search" value={query} onChange={event => resetPage(() => setQuery(event.target.value))} placeholder="Search name or email" className="w-full border border-white/15 bg-[#0d0d0b] py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5f594f] focus:border-gold" /></label>
      <select aria-label="Filter users by plan" value={planFilter} onChange={event => resetPage(() => setPlanFilter(event.target.value))} className="border border-white/15 bg-[#0d0d0b] px-3 py-2 text-xs text-white outline-none focus:border-gold"><option value="all">All plans</option>{LAUNCH_PLANS.map(plan => <option key={plan.key} value={plan.key}>{plan.name}</option>)}</select>
      <select aria-label="Filter users by access" value={accessFilter} onChange={event => resetPage(() => setAccessFilter(event.target.value))} className="border border-white/15 bg-[#0d0d0b] px-3 py-2 text-xs text-white outline-none focus:border-gold"><option value="all">All access states</option><option value="active">Active</option><option value="expired">Expired</option><option value="inactive">Inactive</option></select>
      {mode === "usage" && <select aria-label="Filter users by credit usage" value={usageFilter} onChange={event => resetPage(() => setUsageFilter(event.target.value))} className="border border-white/15 bg-[#0d0d0b] px-3 py-2 text-xs text-white outline-none focus:border-gold"><option value="all">All usage</option><option value="used">Used today</option><option value="recorded">Has recorded usage</option><option value="unused">No usage today</option><option value="exhausted">Limit reached</option></select>}
      <span className="self-center text-xs text-[#777066]">{pagination.total.toLocaleString("en-IN")} matching</span>
    </div>

    <div className="overflow-x-auto border-x border-b border-white/10 bg-[#12120f]">
      {mode === "users" ? <table className="min-w-245 w-full text-left text-xs">
        <thead className="text-[#777066]"><tr>{["User", "Plan", "Access", "Payment", "Paid", "Access ends", "Last login", "Joined"].map(label => <th key={label} className="border-b border-white/10 px-4 py-3 font-bold">{label}</th>)}</tr></thead>
        <tbody>{users.map(record => <tr key={record.id} className="border-b border-white/5 align-top"><td className="px-4 py-4"><strong>{record.name || "Unnamed user"}</strong><span className="mt-1 block text-[#777066]">{record.email}</span></td><td className="px-4 py-4">{planName(record.planKey)}</td><td className={`px-4 py-4 font-bold capitalize ${statusClass(record.accessStatus)}`}>{record.accessStatus}</td><td className="px-4 py-4"><strong className="capitalize">{record.payment.status}</strong><span className="mt-1 block text-[#777066]">{record.payment.currency} {record.payment.amount.toLocaleString("en-IN")}</span></td><td className="px-4 py-4 text-[#aaa397]">{dateTime(record.payment.paidAt)}</td><td className="px-4 py-4">{dateTime(record.planExpiresAt)}</td><td className="px-4 py-4 text-[#aaa397]">{dateTime(record.lastLoginAt)}</td><td className="px-4 py-4 text-[#aaa397]">{dateTime(record.createdAt)}</td></tr>)}</tbody>
      </table> : <table className="min-w-245 w-full text-left text-xs">
        <thead className="text-[#777066]"><tr>{["User", "Plan", "Daily credit usage", "ATS usage", "Usage day", "Access", "Last login"].map(label => <th key={label} className="border-b border-white/10 px-4 py-3 font-bold">{label}</th>)}</tr></thead>
        <tbody>{users.map(record => {
          const creditPercent = record.usage.dailyCreditLimit ? Math.min(100, Math.round((record.usage.creditsUsed / record.usage.dailyCreditLimit) * 100)) : 0;
          const atsLimit = record.usage.atsOptimizationsUsed + record.usage.atsOptimizationsRemaining;
          return <tr key={record.id} className="border-b border-white/5 align-top">
            <td className="px-4 py-4"><strong>{record.name || "Unnamed user"}</strong><span className="mt-1 block text-[#777066]">{record.email}</span></td>
            <td className="px-4 py-4">{planName(record.planKey)}</td>
            <td className="min-w-72 px-4 py-4">
              <div className="mb-2 flex items-center justify-between gap-4"><strong>{creditPercent}% used</strong><span className="text-[#aaa397]">Limit {record.usage.dailyCreditLimit.toLocaleString("en-IN")}</span></div>
              <div role="progressbar" aria-label={`${record.email} daily credit usage`} aria-valuemin={0} aria-valuemax={record.usage.dailyCreditLimit} aria-valuenow={record.usage.creditsUsed} className="h-2 overflow-hidden bg-white/10"><div className="h-full bg-gold" style={{ width: `${creditPercent}%` }} /></div>
              <div className="mt-2 grid grid-cols-2 gap-3"><span><span className="block text-[10px] uppercase text-[#777066]">Used</span><strong>{record.usage.creditsUsed.toLocaleString("en-IN")}</strong></span><span><span className="block text-[10px] uppercase text-[#777066]">Remaining</span><strong>{record.usage.creditsRemaining.toLocaleString("en-IN")}</strong></span></div>
            </td>
            <td className="px-4 py-4"><strong>{record.usage.atsOptimizationsUsed.toLocaleString("en-IN")} used</strong><span className="mt-1 block text-[#777066]">{record.usage.atsOptimizationsRemaining.toLocaleString("en-IN")} remaining · {atsLimit.toLocaleString("en-IN")} limit</span></td>
            <td className="px-4 py-4"><strong>Today: {record.usage.currentUsageDay}</strong><span className="mt-1 block text-[#777066]">Last recorded: {record.usage.creditDay || "Never"}</span><span className="mt-1 block text-[#777066]">Recorded used: {record.usage.lastRecordedCreditsUsed.toLocaleString("en-IN")}</span></td>
            <td className={`px-4 py-4 font-bold capitalize ${statusClass(record.accessStatus)}`}>{record.accessStatus}</td>
            <td className="px-4 py-4 text-[#aaa397]">{dateTime(record.lastLoginAt)}</td>
          </tr>;
        })}</tbody>
      </table>}
      {!loading && data && !users.length && <p className="p-8 text-sm text-[#777066]">No users match these filters.</p>}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-white/10 bg-[#12120f] p-4 text-xs">
      <span className="text-[#777066]">Showing {firstRecord.toLocaleString("en-IN")}–{lastRecord.toLocaleString("en-IN")} of {pagination.total.toLocaleString("en-IN")}</span>
      <div className="flex items-center gap-2">
        <label className="text-[#777066]">Rows <select aria-label="Rows per page" value={pageSize} onChange={event => resetPage(() => setPageSize(Number(event.target.value)))} className="ml-1 border border-white/15 bg-[#0d0d0b] px-2 py-1.5 text-white"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
        <span className="min-w-20 text-center text-[#aaa397]">Page {pagination.page} of {pagination.totalPages}</span>
        <button type="button" title="Previous page" aria-label="Previous page" disabled={loading || pagination.page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))} className="border border-white/15 p-2 text-[#aaa397] hover:text-white disabled:opacity-30"><ChevronLeft size={15} /></button>
        <button type="button" title="Next page" aria-label="Next page" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => setPage(current => current + 1)} className="border border-white/15 p-2 text-[#aaa397] hover:text-white disabled:opacity-30"><ChevronRight size={15} /></button>
      </div>
    </div>
  </>;
}