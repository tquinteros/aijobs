import { Header } from "@/components/header/header"
import { getCurrentUser } from "@/lib/auth/get-current-user"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <>
      <Header user={user} />
      {children}
    </>
  )
}
