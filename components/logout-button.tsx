"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function LogoutButton({ size = "default", className = "" }: { size?: "default" | "sm" | "lg" | "icon", className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [disabled, setDisabled] = useState(false);
  const logout = async () => {
    setDisabled(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    queryClient.clear();
    router.refresh();
    toast.success("Logout successful");
    setDisabled(false);
    };

  return <Button size={size} className={cn("w-full", className)} onClick={logout} disabled={disabled}>
    {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : "Logout"}
  </Button>;
}
