
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, User, Sparkles } from "lucide-react"
import { AIScoreBadge } from "./ai-score-badge";
import { createClient } from "@/lib/supabase/server";

export async function Hero() {

  return (
    <section className="relative min-h-[calc(100dvh-56px)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="relative z-10 container px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Job Matching
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            Find your perfect match.{" "}
            <span className="text-primary">Powered by AI.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            HireMatch uses advanced AI to analyze your skills, experience, and preferences to connect you with opportunities that truly fit.
          </p>
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="w-full sm:w-auto text-base px-8">
              <Link href={hiringHref}>
                <Briefcase className="w-5 h-5 mr-2" />
                {"I'm hiring"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
              <Link href={workHref}>
                <User className="w-5 h-5 mr-2" />
                {"I'm looking for work"}
              </Link>
            </Button>
          </div> */}
          <div className="flex items-center justify-center gap-8 md:gap-12">
            <div className="flex flex-col items-center gap-2">
              <AIScoreBadge score={94} size="lg" />
              <span className="text-sm text-muted-foreground">Perfect Match</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AIScoreBadge score={67} size="lg" />
              <span className="text-sm text-muted-foreground">Good Fit</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AIScoreBadge score={32} size="lg" />
              <span className="text-sm text-muted-foreground">Consider Others</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
