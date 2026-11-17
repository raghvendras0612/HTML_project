"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const authError = searchParams.get("error");
  const { signInWithEmail, signInWithGoogle } = useUser();
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (authError) {
      console.error("[Login Page] Authentication error received:", authError);
      toast.error(authError);
    }
  }, [authError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    const { error } = await signInWithEmail(values.email, values.password);
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Signed in successfully!");
    router.push(nextUrl);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(nextUrl);
    setGoogleLoading(false);
    if (error) {
      console.error("[Login Page] Google sign-in failed:", error);
      toast.error(error);
    }
  };

  return (
    <Card className="w-full curia-card shadow-xl border-border bg-surface">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Sign in to your Curia account to participate in discussions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {authError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-start gap-2">
            <span>{authError}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-border bg-surface-raised hover:bg-surface-raised/80 text-foreground font-medium text-sm h-10"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || submitting}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="bg-surface px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={submitting}
              className="bg-background"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-danger mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
              className="bg-background"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-white shadow-glow-sm h-10 mt-2"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border p-4 text-xs text-muted-foreground">
        <span>Don&apos;t have an account?</span>{" "}
        <Link
          href={`/signup${nextUrl !== "/" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
          className="ml-1 text-accent font-medium hover:underline"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<Card className="w-full h-80 animate-pulse bg-surface" />}>
      <LoginForm />
    </React.Suspense>
  );
}
