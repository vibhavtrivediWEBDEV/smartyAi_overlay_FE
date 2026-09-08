import type { Metadata } from "next";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PricingPlans } from "@/components/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPlans } from "@/lib/api";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Compare SmartyAI plans, daily AI credits, available interview tools, and clearly marked upcoming features.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const plans = await getPlans();
  return (
    <main className="grain min-h-screen bg-ink text-paper">
      <div className="relative z-10"><SiteHeader /></div>
      <section className="pricing-page-hero hero-grid">
        <div className="pricing-hero-glow" aria-hidden="true" />
        <span className="pricing-hero-spark spark-one" aria-hidden="true" />
        <span className="pricing-hero-spark spark-two" aria-hidden="true" />
        <div className="pricing-hero-content">
          <p className="pricing-hero-kicker"><Sparkles size={14} /> Pricing</p>
          <h1 className="display-type">Plan for the conversation <span>ahead.</span></h1>
          <p>Choose the access window that fits your interviews. Available capabilities, action costs, and upcoming automation are separated clearly before checkout.</p>
          <div className="pricing-hero-desk">
            <div className="pricing-hero-desk-title"><small>Live plan desk</small><strong>Pick your runway.<br />Know what is ready.</strong></div>
            <div><small>All plans</small><strong>Core conversation tools</strong></div>
            <div><small>Usage model</small><strong>Credits + duration</strong></div>
            <div><small>Activation</small><strong>Secure Razorpay checkout</strong></div>
          </div>
        </div>
      </section>

      <section className="home-pricing-section pricing-page-plans px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-360">
          <div className="home-pricing-heading">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Choose your access</p>
              <h2 className="display-type mt-4 max-w-3xl text-5xl font-semibold leading-[.92] tracking-normal md:text-7xl">Same intelligence.<br /><span className="text-[#ffae55] italic">Your pace.</span></h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#918a7e]">The plan service supplies every price, duration, and credit allowance shown below.</p>
          </div>
          <PricingPlans plans={plans} />
        </div>
      </section>

      <section className="pricing-trust-strip px-5 py-16 md:px-10">
        <div className="mx-auto grid max-w-360 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            ["Clear daily credits", "Every action cost and daily allowance is visible before purchase."],
            ["Verified checkout", "Plan access activates only after server-side Razorpay signature verification."],
            ["Honest roadmap status", "Naukri Apply is marked Coming soon and is not presented as available today."],
          ].map(([title, body]) => (
            <article key={title} className="bg-[#11110f] p-6 md:p-8">
              <ShieldCheck size={18} className="text-[#ffae55]" />
              <h3 className="mt-6 text-sm font-bold">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#817a6f]">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}