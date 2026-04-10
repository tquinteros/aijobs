"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Search, Handshake, FileText, Users, CheckCircle } from "lucide-react"

const candidateSteps = [
  {
    icon: Upload,
    title: "Upload Your Resume",
    description: "Simply upload your CV and our AI will automatically extract your skills, experience, and preferences."
  },
  {
    icon: Search,
    title: "Get AI Matches",
    description: "Our algorithm analyzes thousands of jobs and ranks them by how well they match your profile."
  },
  {
    icon: Handshake,
    title: "Apply & Connect",
    description: "Apply to your top matches with one click. Companies see your match score instantly."
  }
]

const companySteps = [
  {
    icon: FileText,
    title: "Post Your Job",
    description: "Describe your ideal candidate and requirements. Our AI understands context, not just keywords."
  },
  {
    icon: Users,
    title: "Review Ranked Candidates",
    description: "See all applicants ranked by match score with detailed breakdowns of why they fit."
  },
  {
    icon: CheckCircle,
    title: "Hire Faster",
    description: "Contact top matches directly. Reduce time-to-hire by focusing on the best candidates first."
  }
]

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"candidate" | "company">("candidate")
  
  const steps = activeTab === "candidate" ? candidateSteps : companySteps

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Get started in minutes. Our streamlined process makes job matching simple and effective.
          </p>
          
          {/* Tab Switcher */}
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted">
            <Button
              variant={activeTab === "candidate" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("candidate")}
            >
              For Candidates
            </Button>
            <Button
              variant={activeTab === "company" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("company")}
            >
              For Companies
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )} */}
              
              {/* Step number */}
              <div className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-10 h-10 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
