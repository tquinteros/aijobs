"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "How long does it take for my job post to go live?",
    a: "Your job post goes live immediately after publishing. There is no manual review process — just write, publish, and start receiving applications.",
  },
  {
    q: "Can I edit my job post after publishing?",
    a: "Yes. You can edit, pause, or close any job post at any time from your dashboard. Changes are reflected instantly.",
  },
  {
    q: "How does AI candidate matching work?",
    a: "Our AI analyzes job descriptions and candidate profiles to surface the most relevant matches. It considers skills, experience, location preferences, and more to rank applicants automatically.",
  },
  {
    q: "Do candidates pay to apply?",
    a: "No. Applying to jobs on HireBoard is completely free for candidates. Employers pay to post listings.",
  },
  {
    q: "What's included in the free plan?",
    a: "The Starter plan includes 1 active job post, up to 50 applicants, basic tracking, and a 30-day listing duration — forever free.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. You can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            FAQ
          </p>
          <h2 className="text-4xl font-black tracking-tight text-foreground text-balance md:text-5xl">
            Common questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card overflow-hidden">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border px-6">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
