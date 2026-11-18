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
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]{3,20}$/, "3-20 lowercase letters, numbers, or underscores")
    .optional()
    .or(z.literal("")),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const authError = searchParams.get("error");
  const { signUpWithEmail, signInWithGoogle } = useUser();
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authError) {
      console.error("[Signup Page] Authentication error received:", authError);
      toast.error(authError);
    }
  }, [authError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setSubmitting(true);
    setFormError(null);
    const { error, confirmationRequired } = await signUpWithEmail(
      values.email,
      values.password,
      values.username || undefined
    );
    setSubmitting(false);

    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }

    if (confirmationRequired) {
      setConfirmationEmail(values.email);
      toast.success("Confirmation email sent! Please check your inbox.");
    } else {
      toast.success("Account created successfully!");
      window.location.href = nextUrl;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError(null);
    const { error } = await signInWithGoogle(nextUrl);
    setGoogleLoading(false);
    if (error) {
      console.error("[Signup Page] Google sign-in failed:", error);
      setFormError(error);
      toast.error(error);
    }
  };

  const displayError = authError || formError;

  if (confirmationEmail) {
    return (
      <Card className="w-full curia-card shadow-xl border-border bg-surface text-center p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent mb-4">
          <MailCheck className="h-7 w-7 text-accent-glow" />
        </div>
        <CardTitle className="text-xl font-bold mb-2">Check your email</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-6">
          We sent a verification link to <span className="font-semibold text-foreground">{confirmationEmail}</span>.
          Click the link in the email to activate your Curia account.
        </CardDescription>
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full border-border">
            <Link href="/login">Return to Log In</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full curia-card shadow-xl border-border bg-surface">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Join technical communities, share knowledge, and build karma
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-start gap-2">
            <span>{displayError}</span>
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
            <label className="text-xs font-medium text-foreground">Password (min 8 characters)</label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={submitting}
              className="bg-background"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Username (Optional)</label>
              <span className="text-[10px] text-muted-foreground font-mono">Can change later</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">u/</span>
              <Input
                placeholder="developer_handle"
                disabled={submitting}
                className="bg-background pl-8 font-mono text-sm"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-danger mt-1">{errors.username.message}</p>
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
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border p-4 text-xs text-muted-foreground">
        <span>Already have an account?</span>{" "}
        <Link
          href={`/login${nextUrl !== "/" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
          className="ml-1 text-accent font-medium hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<Card className="w-full h-80 animate-pulse bg-surface" />}>
      <SignupForm />
    </React.Suspense>
  );
}
