import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "What is AIJobs and who is it for?",
    answer:
      "AIJobs is a job platform that uses AI matching between candidates and companies. Candidates get ranked opportunities based on profile compatibility, while companies get better-qualified applicants and deeper AI analysis tools.",
  },
  {
    question: "How does matching work in simple terms?",
    answer:
      "Both candidate profiles and job posts are transformed into AI embeddings. The app compares those vectors with cosine similarity and returns a compatibility score (0-100), then ranks jobs for each candidate from best match to lowest.",
  },
  {
    question: "Do I need to upload a CV to get recommendations?",
    answer:
      "Yes, the best recommendations come from your CV plus profile data. The app parses the PDF and extracts structured information such as skills, experience level, languages, and previous roles to improve matching quality.",
  },
  {
    question: "Can I edit my profile after onboarding?",
    answer:
      "Yes. You can update your profile and CV. When you do, AI embeddings are regenerated and cached match results are refreshed so your rankings stay aligned with your latest experience.",
  },
  {
    question: "How should I interpret the compatibility score?",
    answer:
      "The score is a relevance indicator, not a final hiring decision. A higher score means your profile is semantically closer to a job description based on skills, role context, and experience signals.",
  },
  {
    question: "Can I still apply to jobs with lower scores?",
    answer:
      "Absolutely. Rankings help you prioritize, but you can apply to any active role. Companies still review the full application, profile, and CV before making decisions.",
  },
  {
    question: "How do applications progress after I apply?",
    answer:
      "Applications can move through statuses like applied, reviewed, contacted, and hired. This helps candidates track progress and helps companies manage hiring pipelines efficiently.",
  },
  {
    question: "How does real-time chat work?",
    answer:
      "When a conversation is started, messages are delivered in real time through Supabase Realtime. The UI is optimized for fast feedback so both candidates and companies can communicate without page refreshes.",
  },
  {
    question: "What can companies do on AIJobs?",
    answer:
      "Companies can complete onboarding, create and publish job posts, review applicants, calculate compatibility for candidates, run AI analysis with strengths/gaps/recommendations, and start chat directly from applications.",
  },
  {
    question: "How does AI help companies evaluate applicants?",
    answer:
      "Beyond the match score, companies can run a deeper AI analysis that explains fit, highlights candidate strengths, identifies skill gaps, and provides a recommendation to support decision-making.",
  },
  {
    question: "Is my data protected?",
    answer:
      "Yes. The app uses Supabase Auth, Row Level Security (RLS), ownership checks in server actions, and controlled service-role usage only when needed for specific operations.",
  },
  {
    question: "Why can results change over time?",
    answer:
      "Results can change when you update your profile/CV or when new jobs are published. Matching is recalculated and cache entries are invalidated so rankings reflect the most current data available.",
  },
] as const

export default function FaqItem() {
  return (
    <>
      {FAQS.map((faq, index) => (
        <AccordionItem key={faq.question} value={`faq-${index + 1}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </>
  )
}