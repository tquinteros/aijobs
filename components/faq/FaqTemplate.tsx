import FaqItem from "@/components/faq/FaqItem"
import { Accordion } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function FaqTemplate() {
  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Frequently Asked Questions
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl">How AIJobs Works</CardTitle>
          <CardDescription className="max-w-2xl text-base">
            Everything you need to know about onboarding, AI matching, job
            applications, company workflows, and messaging inside AIJobs.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <FaqItem />
        </Accordion>
      </CardContent>
    </Card>
  )
}