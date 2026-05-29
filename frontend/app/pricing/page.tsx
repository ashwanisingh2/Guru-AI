"use client";

import { useState } from "react";
import { api, trackEvent } from "@/lib/api";

const plans = [
  { id: "starter", name: "Starter", price: "Free", items: ["AI explanations", "Topic map", "Basic analytics"] },
  { id: "pro", name: "Pro", price: "Rs 499/mo", items: ["Offline lessons", "Advanced AI mentor", "Parent dashboard", "Priority practice"] },
  { id: "institute", name: "Institute", price: "Custom", items: ["Admin analytics", "Cohorts", "Regional pricing", "Dedicated support"] }
];

export default function PricingPage() {
  const [message, setMessage] = useState("");

  async function checkout(planId: string) {
    const res = await api<{ message: string }>("/api/payments/checkout", { method: "POST", body: { planId } });
    setMessage(res.message);
    trackEvent("checkout_started", "payments", { planId });
  }

  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-[#9ca3af]">Local mock checkout now works. Stripe/Razorpay can replace this in production.</p>
        {message && <div className="mt-5 rounded border border-[#4ade80]/50 bg-[#052e16]/40 p-3 text-sm text-[#4ade80]">{message}</div>}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded border border-[#1f2937] bg-[#111827] p-5">
              <div className="font-mono text-sm text-[#4ade80]">{plan.name}</div>
              <div className="mt-3 text-3xl font-semibold">{plan.price}</div>
              <ul className="mt-5 space-y-3 text-sm text-[#d1d5db]">
                {plan.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <button onClick={() => checkout(plan.id)} className="mt-6 w-full rounded bg-[#4ade80] px-4 py-3 text-center font-mono text-sm font-bold text-[#052e16]">Choose</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
