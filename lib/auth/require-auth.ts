import { redirect } from "next/navigation"
import { getSession } from "./get-session"

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return session
}