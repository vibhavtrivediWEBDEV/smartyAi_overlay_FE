import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <AuthProvider><DashboardShell>{children}</DashboardShell></AuthProvider>; }