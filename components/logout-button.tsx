"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LogoutButton({ size = "default", className = "" }: { size?: "default" | "sm" | "lg" | "icon", className?: string }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
    toast.success("Logout successful");
  };

  return <Button size={size} className={cn("w-full", className)} onClick={logout}>Logout</Button>;
}
