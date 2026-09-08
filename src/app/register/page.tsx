import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
	const { plan } = await searchParams;
	const selectedPlan = ["trial", "weekly", "monthly", "jobseeker"].includes(plan || "") ? plan : null;
	const redirectTo = selectedPlan ? `/dashboard/plan?plan=${selectedPlan}` : "/dashboard";

	return <AuthForm mode="register" redirectTo={redirectTo} />;
}