"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserRound, Building2 } from "lucide-react";
import { loginAsDemo } from "@/lib/actions/auth";

const DEMO_USERS = {
  candidate: {
    email: "demo-candidate@hirematch.com",
    password: process.env.NEXT_PUBLIC_DEMO_CANDIDATE_PASSWORD!,
    redirect: "/dashboard/candidate",
    label: "Demo Candidate",
    icon: UserRound,
    description: "Full-stack Developer",
  },
  company: {
    email: "demo-recruiter@hirematch.com",
    password: process.env.NEXT_PUBLIC_DEMO_RECRUITER_PASSWORD!,
    redirect: "/dashboard/company",
    label: "Demo Recruiter",
    icon: Building2,
    description: "Hiring",
  },
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"candidate" | "company" | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      queryClient.clear();
      router.push("/");
      router.refresh();
      toast.success("Login successful");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: "candidate" | "company") => {
    setDemoLoading(role)
    setError(null)
    try {
      await loginAsDemo(role)
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") return
      setError("Demo login failed. Please try again.")
      setDemoLoading(null)
    }
  }

  const isAnyLoading = isLoading || demoLoading !== null;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">
              Try a demo account
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["candidate", "company"] as const).map((role) => {
                const demo = DEMO_USERS[role]
                const Icon = demo.icon
                const isThis = demoLoading === role

                return (
                  <button
                    key={role}
                    onClick={() => handleDemoLogin(role)}
                    disabled={isAnyLoading}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                      "hover:border-primary hover:bg-primary/5",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isThis ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isThis ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="text-sm font-semibold">{demo.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground w-full">
                      {demo.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isAnyLoading}>
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}