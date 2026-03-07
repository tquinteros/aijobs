import { QueryProvider } from "@/components/providers/query-provider"

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <QueryProvider>{children}</QueryProvider>
}
