import Link from "next/link";
import { ArrowRight, Check, Clock3 } from "lucide-react";
import type { Plan } from "@/lib/api";

type PricingPlansProps = {
  plans: Plan[];
};

export function PricingPlans({ plans }: PricingPlansProps) {
  if (!plans.length) {
    return (
      <div className="mt-10 border border-white/10 p-6 text-sm text-[#aaa397]">
        Live plan details are temporarily unavailable. Please retry before purchasing.
      </div>
    );
  }

  return (
    <>
      <div className="home-pricing-grid">
        {plans.map((plan) => {
          const featured = plan.key === "monthly";
          const features = [
            { title: `${plan.dailyCreditLimit.toLocaleString("en-IN")} credits per day`, detail: "Chat 2 · Screenshot 4 · Mic 2 · Speaker 2" },
            { title: "Capture-protected overlay", detail: "Requests OS capture exclusion; results vary by platform and sharing app" },
            { title: "Custom AI behavior", detail: "Tune behavioral, technical, and response preferences" },
            { title: `${plan.atsResumeLimit} ATS ${plan.atsResumeLimit === 1 ? "improvement" : "improvements"}`, detail: "Optimize against a target job description" },
            { title: `${plan.linkedinApplications.toLocaleString("en-IN")} LinkedIn job allowance`, detail: plan.linkedinApplications ? "Application automation is being prepared" : "Not included in this plan" },
          ];
          return (
            <article key={plan.key} className={`home-pricing-card${featured ? " featured" : ""}`}>
              {featured && <span className="home-pricing-badge">Most popular</span>}
              <div className="home-pricing-card-head">
                <p className="home-pricing-name">{plan.name}</p>
                <p className="home-pricing-duration">{plan.durationDays} {plan.durationDays === 1 ? "day" : "days"} access</p>
                <p className="home-pricing-price"><span>₹</span>{plan.price.toLocaleString("en-IN")}</p>
                <p className="home-pricing-credit-count"><strong>{plan.dailyCreditLimit.toLocaleString("en-IN")}</strong> AI credits per day</p>
                <p className="home-pricing-description">{plan.description}</p>
              </div>
              <div className="home-pricing-features">
                <p>Available now</p>
                {features.map((feature) => (
                  <div key={feature.title} className="home-pricing-feature">
                    <Check size={15} aria-hidden="true" />
                    <span><strong>{feature.title}</strong><small>{feature.detail}</small></span>
                  </div>
                ))}
                {plan.naukriApplications > 0 && (
                  <div className="home-pricing-feature upcoming">
                    <Clock3 size={15} aria-hidden="true" />
                    <span>
                      <strong>Naukri Apply <em>Coming soon</em></strong>
                      <small>{plan.naukriApplications.toLocaleString("en-IN")} planned applications for this plan after launch</small>
                    </span>
                  </div>
                )}
              </div>
              <Link href={`/register?plan=${plan.key}`} className="home-pricing-cta">Choose {plan.name}<ArrowRight size={15} /></Link>
            </article>
          );
        })}
      </div>
      <p className="home-pricing-note">Each plan is a one-time purchase with no automatic renewal. Create an account, then complete secure Razorpay checkout from your dashboard.</p>
    </>
  );
}