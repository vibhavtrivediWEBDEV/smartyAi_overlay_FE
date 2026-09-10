"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, ContactRound, CreditCard, Download, FileKey, FilePenLine, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, ReceiptText, UserRound, UsersRound } from "lucide-react";
import { useAuth } from "./auth-provider";

const nav = [
  ["Overview", "/dashboard", LayoutDashboard], ["My plan", "/dashboard/plan", CreditCard], ["Usage", "/dashboard/usage", Activity], ["API key", "/dashboard/api-key", FileKey], ["Billing", "/dashboard/billing", ReceiptText], ["User profile", "/dashboard/context", ContactRound], ["Resume builder", "/dashboard/resume-builder", FilePenLine], ["Downloads", "/dashboard/downloads", Download], ["Account", "/dashboard/account", UserRound],
] as const;
const adminNav = [
  ["Payments", "/dashboard/admin", ReceiptText], ["Users", "/dashboard/admin/users", UsersRound], ["Usage", "/dashboard/admin/usage", Activity],
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(pathname === "/dashboard/resume-builder");
  if (loading) return <div className="grid min-h-screen place-items-center bg-ink text-sm text-gold">Loading account…</div>;
  if (!user) return null;
  const visibleNav = user.isAdmin ? adminNav : nav;
  const homeHref = user.isAdmin ? "/dashboard/admin" : "/";
  return <div className={`luxury-dashboard min-h-screen bg-[#0d0d0b] text-paper lg:grid ${sidebarCollapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[250px_1fr]"}`}>
    <aside className="luxury-dashboard-sidebar relative border-b border-white/10 bg-[#090908] transition-[width] lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className={`flex h-18 items-center justify-between px-5 ${sidebarCollapsed ? "lg:justify-center lg:px-2" : "lg:px-7"}`}>
        <Link href={homeHref} aria-label={user.isAdmin ? "SmartyAI admin home" : "SmartyAI home"} className={`display-type font-bold ${sidebarCollapsed ? "lg:text-xl" : "text-2xl"}`}><span className={sidebarCollapsed ? "lg:hidden" : ""}>Smarty</span><span className="text-gold">AI</span></Link>
        <button type="button" onClick={logout} title="Log out" className="p-2 text-[#8f887d] hover:text-white lg:hidden"><LogOut size={18} /></button>
      </div>
      <nav className={`flex gap-1 overflow-x-auto border-t border-white/10 p-3 lg:grid lg:overflow-visible ${sidebarCollapsed ? "lg:px-2" : "lg:p-4"}`} aria-label={user.isAdmin ? "Admin navigation" : "Account navigation"}>{visibleNav.map(([label, href, Icon]) => { const active = href === "/dashboard/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} title={sidebarCollapsed ? label : undefined} aria-label={label} className={`flex shrink-0 items-center border-l-2 py-2.5 text-sm transition max-sm:w-11 max-sm:justify-center max-sm:px-2 ${sidebarCollapsed ? "lg:justify-center lg:px-2" : "gap-3 px-3"} ${active ? "border-gold bg-white/5 text-white" : "border-transparent text-[#8f887d] hover:text-white"}`}><Icon size={17} /><span className={`${sidebarCollapsed ? "lg:hidden" : ""} max-sm:hidden`}>{label}</span></Link>; })}</nav>
      <div className={`hidden px-2 lg:absolute lg:bottom-5 lg:grid lg:w-full lg:gap-2 ${sidebarCollapsed ? "" : "lg:px-4"}`}>
        <button type="button" onClick={() => setSidebarCollapsed((current) => !current)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className={`flex items-center border border-white/10 py-2.5 text-sm text-[#8f887d] hover:border-white/20 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}`}>{sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span className={sidebarCollapsed ? "hidden" : ""}>Collapse</span></button>
        <button type="button" onClick={logout} title="Log out" className={`flex items-center border border-white/10 py-2.5 text-sm text-[#8f887d] hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}`}><LogOut size={16} /><span className={sidebarCollapsed ? "hidden" : ""}>Log out</span></button>
      </div>
    </aside>
    <div className="luxury-dashboard-main min-w-0"><header className="luxury-dashboard-header flex min-h-18 items-center justify-between border-b border-white/10 px-5 md:px-8"><p className="text-xs font-bold uppercase tracking-[.13em] text-[#7c756b]">{user.isAdmin ? "Admin workspace" : "Account workspace"}</p><div className="min-w-0 text-right"><p className="truncate text-sm font-bold">{user.name}</p><p className="max-w-52 truncate text-[11px] text-[#777066]">{user.email}</p></div></header><div className="luxury-dashboard-content p-5 md:p-8 lg:p-10">{children}</div></div>
  </div>;
}