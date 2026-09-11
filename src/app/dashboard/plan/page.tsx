"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Check, Clock3, CreditCard, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeading } from "@/components/dashboard-ui";
import { apiRequest, getPlans, Plan } from "@/lib/api";

type CheckoutPayment = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type CheckoutOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  customer: { name: string; email: string };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (payment: CheckoutPayment) => void;
  modal: { ondismiss: () => void };
};

type RazorpayFailure = {
  error?: { description?: string };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (failure: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

export default function PlanPage() {
  const { user, refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  useEffect(() => { getPlans().then(setPlans).catch((error) => setNotice(error.message)); }, []);

  async function purchase(plan: Plan) {
    setBusy(plan.key); setNotice("");
    try {
      if (!window.Razorpay || !checkoutReady) throw new Error("Secure checkout is still loading. Please try again.");
      const order = await apiRequest<CheckoutOrder>("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ planKey: plan.key, amount: plan.price }),
      });
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SmartyAI",
        description: `${order.planName} one-time access`,
        order_id: order.orderId,
        prefill: order.customer,
        theme: { color: "#c6a15b" },
        handler: async (payment) => {
          try {
            await apiRequest("/api/payment/verify", {
              method: "POST",
              body: JSON.stringify(payment),
            });
            await refresh();
            setNotice(`${order.planName} activated. Payment verified successfully.`);
          } catch (error) {
            setNotice(error instanceof Error ? error.message : "Payment verification failed");
          } finally {
            setBusy(null);
          }
        },
        modal: { ondismiss: () => { setNotice("Payment cancelled. No charge was completed."); setBusy(null); } },
      });
      checkout.on("payment.failed", (failure) => {
        setNotice(failure.error?.description || "Payment failed. Please try again.");
        setBusy(null);
      });
      checkout.open();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkout failed");
      setBusy(null);
    }
  }

  return <><Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setCheckoutReady(true)} onError={() => setNotice("Secure checkout could not load. Check your connection and try again.")} /><PageHeading eyebrow="One-time payment" title="Choose access" description="Pay once with Razorpay. There is no recurring charge or automatic renewal." /><div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => { const active = user?.plan === plan.key; return <article key={plan.key} className="bg-[#12120f] p-6"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.13em] text-gold">{plan.name}</p>{active && <span className="bg-gold/15 px-2 py-1 text-[10px] font-bold uppercase text-gold">Current</span>}</div><p className="display-type mt-5 text-4xl font-semibold">₹{plan.price.toLocaleString("en-IN")}</p><p className="mt-2 text-xs text-[#777066]">{plan.durationDays} days · {plan.dailyCreditLimit.toLocaleString("en-IN")} credits/day</p><p className="mt-5 min-h-12 text-xs leading-5 text-[#918a7e]">{plan.description}</p><div className="mt-4 space-y-2 text-xs text-[#aaa397]"><p>{plan.atsResumeLimit} ATS improvements</p><p>{plan.linkedinApplications.toLocaleString("en-IN")} LinkedIn application allowance</p><p>Custom AI behavior and overlay included</p>{plan.naukriApplications > 0 && <p className="flex items-center gap-2 border border-dashed border-[#7ed3e8]/30 bg-[#7ed3e8]/5 px-2.5 py-2 text-[#9ae2f2]"><Clock3 size={13} aria-hidden="true" /><span>Naukri Apply · {plan.naukriApplications} applications · Coming soon</span></p>}</div><button type="button" disabled={!checkoutReady || busy !== null} onClick={() => purchase(plan)} className="mt-6 flex w-full items-center justify-center gap-2 border border-gold/50 px-3 py-2.5 text-xs font-bold text-gold disabled:border-white/10 disabled:text-[#5f5a52]">{busy === plan.key ? <LoaderCircle size={14} className="animate-spin" /> : active ? <Check size={14} /> : <CreditCard size={14} />}{`Pay ₹${plan.price.toLocaleString("en-IN")}`}</button></article>; })}</div>{notice && <p role="status" className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-[#c9c2b4]">{notice}</p>}<p className="mt-6 text-xs leading-5 text-[#777066]">Naukri Apply is on the roadmap and is not included in today&apos;s checkout. Each purchase is a one-time payment.</p></>;
}