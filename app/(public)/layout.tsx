import { Suspense } from "react"
import { Header } from "@/components/header/header"
import { getCurrentUser } from "@/lib/auth/get-current-user"

async function HeaderWithUser() {
  const user = await getCurrentUser()
  return <Header user={user} />
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={<Header user={null} />}>
        <HeaderWithUser />
      </Suspense>
      {children}
    </>
  )
}
